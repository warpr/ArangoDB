////////////////////////////////////////////////////////////////////////////////
/// @brief logger stream
///
/// @file
///
/// DISCLAIMER
///
/// Copyright 2004-2013 triAGENS GmbH, Cologne, Germany
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
/// Copyright holder is triAGENS GmbH, Cologne, Germany
///
/// @author Dr. Frank Celler
/// @author Achim Brandt
/// @author Copyright 2007-2013, triAGENS GmbH, Cologne, Germany
////////////////////////////////////////////////////////////////////////////////

#ifndef TRIAGENS_LOGGER_LOGGER_STREAM_H
#define TRIAGENS_LOGGER_LOGGER_STREAM_H 1

#include "Basics/Common.h"

#include "Logger/LoggerInfo.h"

namespace triagens {
  namespace basics {

// -----------------------------------------------------------------------------
// --SECTION--                                                class LoggerStream
// -----------------------------------------------------------------------------

////////////////////////////////////////////////////////////////////////////////
/// @addtogroup Logging
/// @{
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
/// @brief logger stream
////////////////////////////////////////////////////////////////////////////////

    class LoggerStream {
      LoggerStream& operator= (LoggerStream const&);
      LoggerStream (LoggerStream const&);

////////////////////////////////////////////////////////////////////////////////
/// @}
////////////////////////////////////////////////////////////////////////////////

// -----------------------------------------------------------------------------
// --SECTION--                                      constructors and destructors
// -----------------------------------------------------------------------------

////////////////////////////////////////////////////////////////////////////////
/// @addtogroup Logging
/// @{
////////////////////////////////////////////////////////////////////////////////

      public:

////////////////////////////////////////////////////////////////////////////////
/// @brief constructs a new logger stream
////////////////////////////////////////////////////////////////////////////////

        LoggerStream ();

////////////////////////////////////////////////////////////////////////////////
/// @brief constructs a new logger stream with given info
////////////////////////////////////////////////////////////////////////////////

        LoggerStream (LoggerData::Info const&);

////////////////////////////////////////////////////////////////////////////////
/// @brief move or copy constructor
////////////////////////////////////////////////////////////////////////////////

#if defined(_MSC_VER)
        LoggerStream (LoggerStream&&);
#else
        LoggerStream (LoggerStream const&);
#endif

////////////////////////////////////////////////////////////////////////////////
/// @brief destructs a logger stream
////////////////////////////////////////////////////////////////////////////////

        ~LoggerStream ();

////////////////////////////////////////////////////////////////////////////////
/// @}
////////////////////////////////////////////////////////////////////////////////

// -----------------------------------------------------------------------------
// --SECTION--                                                    public methods
// -----------------------------------------------------------------------------

////////////////////////////////////////////////////////////////////////////////
/// @addtogroup Logging
/// @{
////////////////////////////////////////////////////////////////////////////////

      public:

////////////////////////////////////////////////////////////////////////////////
/// @brief if enabled, log everything to the string stream
////////////////////////////////////////////////////////////////////////////////

        template<typename T>
        LoggerStream& operator<< (const T& value) {
          if (_stream != 0) {
            *_stream << value;
          }

          return *this;
        }

////////////////////////////////////////////////////////////////////////////////
/// @brief outputs a nicely formatted vector
////////////////////////////////////////////////////////////////////////////////

        template<typename T>
        LoggerStream& operator<< (const vector<T>& value) {
          if (_stream != 0) {
            bool sep = false;

            for (typename vector<T>::const_iterator i = value.begin();  i != value.end();  i++) {
              if (sep) {
                *_stream << ", ";
              }
              else {
                sep = true;
              }

              *this << *i;
            }
          }

          return *this;
        }

////////////////////////////////////////////////////////////////////////////////
/// @brief catches a special stream operator
////////////////////////////////////////////////////////////////////////////////

        LoggerStream& operator<< (std::ostream& (*fptr)(std::ostream&));

////////////////////////////////////////////////////////////////////////////////
/// @brief catches a log level
////////////////////////////////////////////////////////////////////////////////

        LoggerStream& operator<< (TRI_log_level_e);

////////////////////////////////////////////////////////////////////////////////
/// @brief catches a category
////////////////////////////////////////////////////////////////////////////////

        LoggerStream& operator<< (TRI_log_category_e);

////////////////////////////////////////////////////////////////////////////////
/// @brief catches a severity
////////////////////////////////////////////////////////////////////////////////

        LoggerStream& operator<< (TRI_log_severity_e);

////////////////////////////////////////////////////////////////////////////////
/// @brief catches a functional category
////////////////////////////////////////////////////////////////////////////////

        LoggerStream& operator<< (LoggerData::Functional const&);

////////////////////////////////////////////////////////////////////////////////
/// @brief catches a message identifier
////////////////////////////////////////////////////////////////////////////////

        LoggerStream& operator<< (LoggerData::MessageIdentifier const&);

////////////////////////////////////////////////////////////////////////////////
/// @brief catches a peg
////////////////////////////////////////////////////////////////////////////////

        LoggerStream& operator<< (LoggerData::Peg const&);

////////////////////////////////////////////////////////////////////////////////
/// @brief catches a task
////////////////////////////////////////////////////////////////////////////////

        LoggerStream& operator<< (LoggerData::Task const&);

////////////////////////////////////////////////////////////////////////////////
/// @brief catches a position
////////////////////////////////////////////////////////////////////////////////

        LoggerStream& operator<< (LoggerData::Position const&);

////////////////////////////////////////////////////////////////////////////////
/// @brief catches a measure
////////////////////////////////////////////////////////////////////////////////

        LoggerStream& operator<< (LoggerData::Measure const&);

////////////////////////////////////////////////////////////////////////////////
/// @brief catches an extra
////////////////////////////////////////////////////////////////////////////////

        LoggerStream& operator<< (LoggerData::Extra const&);

////////////////////////////////////////////////////////////////////////////////
/// @brief catches an user identifier
////////////////////////////////////////////////////////////////////////////////

        LoggerStream& operator<< (LoggerData::UserIdentifier const&);

////////////////////////////////////////////////////////////////////////////////
/// @}
////////////////////////////////////////////////////////////////////////////////

// -----------------------------------------------------------------------------
// --SECTION--                                                 private variables
// -----------------------------------------------------------------------------

////////////////////////////////////////////////////////////////////////////////
/// @addtogroup Logging
/// @{
////////////////////////////////////////////////////////////////////////////////

      private:

////////////////////////////////////////////////////////////////////////////////
/// @brief output stream
////////////////////////////////////////////////////////////////////////////////

        stringstream* _stream;


////////////////////////////////////////////////////////////////////////////////
/// @brief information
////////////////////////////////////////////////////////////////////////////////

        LoggerData::Info _info;
    };
  }
}

////////////////////////////////////////////////////////////////////////////////
/// @}
////////////////////////////////////////////////////////////////////////////////

#endif

// Local Variables:
// mode: outline-minor
// outline-regexp: "/// @brief\\|/// {@inheritDoc}\\|/// @addtogroup\\|/// @page\\|// --SECTION--\\|/// @\\}"
// End:
