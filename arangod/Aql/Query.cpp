////////////////////////////////////////////////////////////////////////////////
/// @brief Aql, query context
///
/// @file
///
/// DISCLAIMER
///
/// Copyright 2014 ArangoDB GmbH, Cologne, Germany
/// Copyright 2004-2014 triAGENS GmbH, Cologne, Germany
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///
/// Copyright holder is ArangoDB GmbH, Cologne, Germany
///
/// @author Jan Steemann
/// @author Copyright 2014, ArangoDB GmbH, Cologne, Germany
/// @author Copyright 2012-2013, triAGENS GmbH, Cologne, Germany
////////////////////////////////////////////////////////////////////////////////

#include "Aql/Query.h"
#include "Aql/Parser.h"
#include "Aql/V8Executor.h"
#include "BasicsC/json.h"
#include "Utils/Exception.h"
#include "VocBase/vocbase.h"

#include "Basics/JsonHelper.h"

using namespace triagens::aql;

// -----------------------------------------------------------------------------
// --SECTION--                                        constructors / destructors
// -----------------------------------------------------------------------------

////////////////////////////////////////////////////////////////////////////////
/// @brief creates a query
////////////////////////////////////////////////////////////////////////////////

Query::Query (TRI_vocbase_t* vocbase,
              char const* queryString,
              size_t queryLength,
              TRI_json_t* bindParameters)
  : _vocbase(vocbase),
    _executor(nullptr),
    _queryString(queryString),
    _queryLength(queryLength),
    _type(AQL_QUERY_READ),
    _bindParameters(bindParameters) {

  TRI_ASSERT(_vocbase != nullptr);
}

////////////////////////////////////////////////////////////////////////////////
/// @brief destroys a query
////////////////////////////////////////////////////////////////////////////////

Query::~Query () {
  if (_executor != nullptr) {
    delete _executor;
    _executor = nullptr;
  }
}

// -----------------------------------------------------------------------------
// --SECTION--                                                    public methods
// -----------------------------------------------------------------------------

////////////////////////////////////////////////////////////////////////////////
/// @brief extract a region from the query
////////////////////////////////////////////////////////////////////////////////

std::string Query::extractRegion (int line, 
                                  int column) const {
  // note: line numbers reported by bison/flex start at 1, columns start at 0
  int currentLine   = 1;
  int currentColumn = 0;

  char c;
  char const* p = _queryString;

  while ((c = *p)) {
    if (currentLine > line || 
        (currentLine >= line && currentColumn >= column)) {
      break;
    }

    if (c == '\n') {
      ++p;
      ++currentLine;
      currentColumn = 0;
    }
    else if (c == '\r') {
      ++p;
      ++currentLine;
      currentColumn = 0;

      // eat a following newline
      if (*p == '\n') {
        ++p;
      }
    }
    else {
      ++currentColumn;
      ++p;
    }
  }

  // p is pointing at the position in the query the parse error occurred at
  TRI_ASSERT(p >= _queryString);

  size_t offset = static_cast<size_t>(p - _queryString);

  static int const   SNIPPET_LENGTH = 32;
  static char const* SNIPPET_SUFFIX = "...";

  if (_queryLength < offset + SNIPPET_LENGTH) {
    // return a copy of the region
    return std::string(_queryString + offset, _queryLength - offset);
  }

  // copy query part
  std::string result(_queryString + offset, SNIPPET_LENGTH);
  result.append(SNIPPET_SUFFIX);

  return result;
}

////////////////////////////////////////////////////////////////////////////////
/// @brief register an error
////////////////////////////////////////////////////////////////////////////////

void Query::registerError (int code,
                           char const* details) {

  TRI_ASSERT(code != TRI_ERROR_NO_ERROR);

  if (details == nullptr) {
    THROW_ARANGO_EXCEPTION(code);
  }
  else {
    THROW_ARANGO_EXCEPTION_STRING(code, details);
  }
}

////////////////////////////////////////////////////////////////////////////////
/// @brief execute an AQL query - TODO: implement and determine return type
////////////////////////////////////////////////////////////////////////////////

ParseResult Query::execute () {
  try {
    Parser parser(this);
    parser.parse();
    parser.ast()->injectBindParameters(_bindParameters);
    parser.ast()->optimize();
  
    ParseResult result(TRI_ERROR_NO_ERROR);
    result.json = parser.ast()->toJson(TRI_UNKNOWN_MEM_ZONE);

    return result;
  }
  catch (triagens::arango::Exception const& ex) {
    return ParseResult(ex.code(), ex.message());
  }
  catch (...) {
    return ParseResult(TRI_ERROR_OUT_OF_MEMORY, TRI_errno_string(TRI_ERROR_OUT_OF_MEMORY));
  }
}

////////////////////////////////////////////////////////////////////////////////
/// @brief parse an AQL query
////////////////////////////////////////////////////////////////////////////////

ParseResult Query::parse () {
  try {
    Parser parser(this);
    return parser.parse();
  }
  catch (triagens::arango::Exception const& ex) {
    return ParseResult(ex.code(), ex.message());
  }
  catch (...) {
    return ParseResult(TRI_ERROR_OUT_OF_MEMORY, TRI_errno_string(TRI_ERROR_OUT_OF_MEMORY));
  }
}

////////////////////////////////////////////////////////////////////////////////
/// @brief explain an AQL query - TODO: implement and determine return type
////////////////////////////////////////////////////////////////////////////////

void Query::explain () {
}

////////////////////////////////////////////////////////////////////////////////
/// @brief get v8 executor
////////////////////////////////////////////////////////////////////////////////

V8Executor* Query::getExecutor () {
  if (_executor == nullptr) {
    _executor = new V8Executor;
  }

  TRI_ASSERT(_executor != nullptr);
  return _executor;
}

// -----------------------------------------------------------------------------
// --SECTION--                                                       END-OF-FILE
// -----------------------------------------------------------------------------

// Local Variables:
// mode: outline-minor
// outline-regexp: "/// @brief\\|/// {@inheritDoc}\\|/// @page\\|// --SECTION--\\|/// @\\}"
// End: