/*jslint indent: 2, nomen: true, maxlen: 120, vars: true, white: true, plusplus: true, nonpropdel: true, continue: true, regexp: true */
/*global require, exports, module */

////////////////////////////////////////////////////////////////////////////////
/// @brief ArangoDB Application Launcher
///
/// @file
///
/// DISCLAIMER
///
/// Copyright 2013 triAGENS GmbH, Cologne, Germany
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
/// @author Jan Steemann
/// @author Dr. Frank Celler
/// @author Copyright 2013, triAGENS GmbH, Cologne, Germany
////////////////////////////////////////////////////////////////////////////////

var internal = require("internal");

var fs = require("fs");

var arangodb = require("org/arangodb");
var arangosh = require("org/arangodb/arangosh");

var errors = arangodb.errors;
var ArangoError = arangodb.ArangoError;
var arango = internal.arango;
var db = arangodb.db;

// -----------------------------------------------------------------------------
// --SECTION--                                                 private functions
// -----------------------------------------------------------------------------

////////////////////////////////////////////////////////////////////////////////
/// @brief returns the aal collection
////////////////////////////////////////////////////////////////////////////////

function getStorage () {
  'use strict';

  return db._collection('_aal');
}

////////////////////////////////////////////////////////////////////////////////
/// @brief returns the aal collection
////////////////////////////////////////////////////////////////////////////////

function getFishbowlStorage () {
  'use strict';

  return db._collection('_fishbowl');
}

////////////////////////////////////////////////////////////////////////////////
/// @brief returns the fishbow repository
////////////////////////////////////////////////////////////////////////////////

function getFishbowlUrl (version) {
  'use strict';

  return "triAGENS/foxx-apps";
}

////////////////////////////////////////////////////////////////////////////////
/// @brief builds a github repository URL
////////////////////////////////////////////////////////////////////////////////

function buildGithubUrl (repository, version) {
  'use strict';

  if (typeof version === "undefined") {
    version = "master";
  }

  return 'https://github.com/' + repository + '/archive/' + version + '.zip';
}

////////////////////////////////////////////////////////////////////////////////
/// @brief builds a github repository URL
////////////////////////////////////////////////////////////////////////////////

function buildGithubFishbowlUrl (name) {
  'use strict';

  return "https://raw.github.com/" + getFishbowlUrl() + "/master/applications/" + name + ".json";
}

////////////////////////////////////////////////////////////////////////////////
/// @brief thrown an error in case a download failed
////////////////////////////////////////////////////////////////////////////////

function throwDownloadError (msg) {
  'use strict';

  throw new ArangoError({
    errorNum: errors.ERROR_APPLICATION_DOWNLOAD_FAILED.code,
    errorMessage: errors.ERROR_APPLICATION_DOWNLOAD_FAILED.message + ': ' + String(msg)
  });
}

////////////////////////////////////////////////////////////////////////////////
/// @brief thrown an error in case of missing file
////////////////////////////////////////////////////////////////////////////////

function throwFileNoteFound (msg) {
  'use strict';

  throw new ArangoError({
    errorNum: errors.ERROR_FILE_NOT_FOUND.code,
    errorMessage: errors.ERROR_FILE_NOT_FOUND.message + ': ' + String(msg)
  });
}

////////////////////////////////////////////////////////////////////////////////
/// @brief thrown an error in case of a bad parameter
////////////////////////////////////////////////////////////////////////////////

function throwBadParameter (msg) {
  'use strict';

  throw new ArangoError({
    errorNum: errors.ERROR_BAD_PARAMETER.code,
    errorMessage: errors.ERROR_BAD_PARAMETER.message + ': ' + String(msg)
  });
}

////////////////////////////////////////////////////////////////////////////////
/// @brief validate an app name and fail if it is invalid
////////////////////////////////////////////////////////////////////////////////

function validateAppName (name) {
  'use strict';

  if (typeof name === 'string' && name.length > 0) {
    return;
  }

  throw new ArangoError({
    errorNum: errors.ERROR_APPLICATION_INVALID_NAME.code,
    errorMessage: errors.ERROR_APPLICATION_INVALID_NAME.message
  });
}

////////////////////////////////////////////////////////////////////////////////
/// @brief validate a mount and fail if it is invalid
////////////////////////////////////////////////////////////////////////////////

function validateMount (mnt) {
  'use strict';

  if (typeof mnt === 'string' && mnt.substr(0, 1) === '/') {
    return;
  }

  throw new ArangoError({
    errorNum: errors.ERROR_APPLICATION_INVALID_MOUNT.code,
    errorMessage: errors.ERROR_APPLICATION_INVALID_MOUNT.message + ': ' + String(mnt)
  });
}

////////////////////////////////////////////////////////////////////////////////
/// @brief extracts the name and version from a manifest file
////////////////////////////////////////////////////////////////////////////////

function extractNameAndVersionManifest (source, filename) {
  'use strict';

  var manifest = JSON.parse(fs.read(filename));

  source.name = manifest.name;
  source.version = manifest.version;
}

////////////////////////////////////////////////////////////////////////////////
/// @brief processes files in a directory
////////////////////////////////////////////////////////////////////////////////

function processDirectory (source) {
  'use strict';

  var location = source.location;

  if (! fs.exists(location) || ! fs.isDirectory(location)) {
    throwFileNoteFound("'" + String(location) + "' is not a directory");
  }
  
  // .............................................................................
  // extract name and version from manifest
  // .............................................................................

  extractNameAndVersionManifest(source, fs.join(location, "manifest.json"));

  // .............................................................................
  // extract name and version from manifest
  // .............................................................................

  var tree = fs.listTree(location);
  var files = [];
  var i;

  for (i = 0;  i < tree.length;  ++i) {
    var filename = fs.join(location, tree[i]);

    if (fs.isFile(filename)) {
      files.push(tree[i]);
    }
  }

  if (files.length === 0) {
    throwFileNoteFound("Directory '" + String(location) + "' is empty");
  }

  var tempFile = fs.getTempFile("downloads", false); 
  source.filename = tempFile;
  source.removeFile = true;
    
  fs.zipFile(tempFile, location, files);
}

////////////////////////////////////////////////////////////////////////////////
/// @brief extracts the name and version from a zip
////////////////////////////////////////////////////////////////////////////////

function repackZipFile (source) {
  'use strict';

  var i;

  var filename = source.filename;
  var path = fs.getTempFile("zip", false); 

  fs.unzipFile(filename, path, false, true);

  // .............................................................................
  // locate the manifest file
  // .............................................................................

  var tree = fs.listTree(path).sort(function(a,b) { return a.length - b.length; });
  var found;
  var mf = "manifest.json";
  var re = /\/manifest\.json$/;

  for (i = 0;  i < tree.length && found === undefined;  ++i) {
    var tf = tree[i];

    if (re.test(tf) || tf === mf) {
      found = tf;
    }
  }

  if (found === "undefined") {
    throwFileNoteFound("Cannot find manifest file '" + filename + "'");
  }

  var mp;

  if (found === mf) {
    mp = ".";
  }
  else {
    mp = found.substr(0, found.length - mf.length - 1);
  }

  // .............................................................................
  // throw away source file if necessary
  // .............................................................................

  if (source.removeFile && source.filename !== '') {
    try {
      fs.remove(source.filename);
    }
    catch (err1) {
      arangodb.printf("Cannot remove temporary file '%s'\n", source.filename);
    }
  } 

  delete source.filename;
  delete source.removeFile;

  // .............................................................................
  // repack the zip file
  // .............................................................................

  var newSource = { location: fs.join(path, mp) };

  processDirectory(newSource);

  source.name = newSource.name;
  source.version = newSource.version;
  source.filename = newSource.filename;
  source.removeFile = newSource.removeFile;

  // .............................................................................
  // cleanup temporary paths
  // .............................................................................

  try {
    fs.removeDirectoryRecursive(path);
  }
  catch (err2) {
    arangodb.printf("Cannot remove temporary directory '%s'\n", path);
  }
}

////////////////////////////////////////////////////////////////////////////////
/// @brief processes files in a zip file
////////////////////////////////////////////////////////////////////////////////

function processZip (source) {
  'use strict';

  var location = source.location;

  if (! fs.exists(location) || ! fs.isFile(location)) {
    throwFileNoteFound("Cannot find zip file '" + String(location) + "'");
  }

  source.filename = source.location;
  source.removeFile = false;

  repackZipFile(source);
}

////////////////////////////////////////////////////////////////////////////////
/// @brief processes files from a github repository 
////////////////////////////////////////////////////////////////////////////////

function processGithubRepository (source) {
  'use strict';

  var url = buildGithubUrl(source.location, source.version);
  var tempFile = fs.getTempFile("downloads", false); 

  try {
    var result = internal.download(url, "", { method: "get", followRedirects: true, timeout: 30 }, tempFile);

    if (result.code >= 200 && result.code <= 299) {
      source.filename = tempFile;
      source.removeFile = true;
    }
    else {
      throwDownloadError("Could not download from repository '" + url + "'");
    }
  }
  catch (err) {
    throwDownloadError("Could not download from repository '" + url + "': " + String(err));
  }

  repackZipFile(source);
}

////////////////////////////////////////////////////////////////////////////////
/// @brief processes a source declaration
////////////////////////////////////////////////////////////////////////////////

function processSource (src) {
  'use strict';

  if (src.type === "zip") {
    processZip(src);
  }
  else if (src.type === "directory") {
    processDirectory(src);
  }
  else if (src.type === "github") {
    processGithubRepository(src);
  }
  else {
    throwBadParameter("Unknown application type '" + src.type + "'");
  }

  // upload file to the server 
  var response = internal.arango.SEND_FILE("/_api/upload", src.filename);

  if (src.removeFile && src.filename !== '') {
    try {
      fs.remove(src.filename);
    }
    catch (err2) {
      arangodb.printf("Cannot remove temporary file '%s'\n", src.filename);
    }
  } 

  if (! response.filename) {
    throw new ArangoError({
      errorNum: errors.ERROR_APPLICATION_UPLOAD_FAILED.code,
      errorMessage: errors.ERROR_APPLICATION_UPLOAD_FAILED.message
                  + ": " + String(response.errorMessage)
    });
  }

  return response.filename;
}

////////////////////////////////////////////////////////////////////////////////
/// @brief updates the fishbowl from a zip archive
////////////////////////////////////////////////////////////////////////////////

function updateFishbowlFromZip (filename) {
  'use strict';

  var i;
  var tempPath = fs.getTempPath();
  var toSave = [ ];

  try {
    fs.makeDirectoryRecursive(tempPath);
    fs.unzipFile(filename, tempPath, false, true);

    var root = fs.join(tempPath, "foxx-apps-master/applications");

    if (! fs.exists(root)) {
      throw new Error("Applications diectory is missing in foxx-apps, giving up");
    }

    var m = fs.listTree(root);
    var reSub = /(.*)\.json$/;
    
    for (i = 0;  i < m.length;  ++i) {
      var f = m[i];
      var match = reSub.exec(f);

      if (match === null) {
        continue;
      }

      var app = fs.join(root, f);
      var desc;

      try {
        desc = JSON.parse(fs.read(app));
      }
      catch (err1) {
        arangodb.printf("Cannot parse description for app '" + f + "': %s\n", String(err1));
        continue;
      }

      desc._key = match[1];

      if (! desc.hasOwnProperty("name")) {
        desc.name = match[1];
      }

      toSave.push(desc);
    }

    if (toSave.length > 0) {
      var fishbowl = getFishbowlStorage();

      db._executeTransaction({
        collections: {
          write: fishbowl.name()
        },
        action: function (params) {
          var c = require("internal").db._collection(params.collection);
          c.truncate();

          params.apps.forEach(function(app) {
            c.save(app);
          });
        },
        params: {
          apps: toSave,
          collection: fishbowl.name()
        }
      });

      arangodb.printf("Updated local repository information with %d application(s)\n", 
                      toSave.length);
    }
  }
  catch (err) {
    if (tempPath !== undefined && tempPath !== "") {
      try {
        fs.removeDirectoryRecursive(tempPath);
      }
      catch (err2) {
      }
    }

    throw err;
  }
}

////////////////////////////////////////////////////////////////////////////////
/// @brief downloads the fishbowl repository
////////////////////////////////////////////////////////////////////////////////

function updateFishbowl () {
  'use strict';

  var i;

  var url = buildGithubUrl(getFishbowlUrl());
  var filename = fs.getTempFile("downloads", false); 
  var path = fs.getTempFile("zip", false); 

  try {
    var result = internal.download(url, "", { method: "get", followRedirects: true, timeout: 30 }, filename);

    if (result.code < 200 || result.code > 299) {
      throwDownloadError("Github download from '" + url + "' failed with error code " + result.code);
    }

    updateFishbowlFromZip(filename);

    filename = undefined;
  }
  catch (err) {
    if (filename !== undefined && fs.exists(filename)) {
      fs.remove(filename);
    }

    try {
      fs.removeDirectoryRecursive(path);
    } 
    catch (err2) {
    }

    throw err;
  }
}

////////////////////////////////////////////////////////////////////////////////
/// @brief comparator for applications
////////////////////////////////////////////////////////////////////////////////

function compareApps (l, r) { 
  'use strict';

  var left = l.name.toLowerCase();
  var right = r.name.toLowerCase();

  if (left < right) { 
    return -1; 
  }

  if (right < left) { 
    return 1; 
  }

  return 0;
}

////////////////////////////////////////////////////////////////////////////////
/// @brief prints out usage message for the command-line tool
////////////////////////////////////////////////////////////////////////////////

function cmdUsage () {
  'use strict';

  var printf = arangodb.printf;
  var fm = "foxx-manager";

  printf("Example usage:\n");
  printf("%s install <foxx> <mount-point>\n", fm);
  printf("%s uninstall <mount-point>\n\n", fm);

  printf("Further help:\n");
  printf("%s help\n", fm);
}

// -----------------------------------------------------------------------------
// --SECTION--                                                  public functions
// -----------------------------------------------------------------------------

////////////////////////////////////////////////////////////////////////////////
/// @brief command line dispatcher
////////////////////////////////////////////////////////////////////////////////

exports.run = function (args) {
  'use strict';

  if (typeof args === 'undefined' || args.length === 0) {
    arangodb.print("Expecting a command, please try:\n");
    cmdUsage();
    return 0;
  }

  var type = args[0];

  try {
    if (type === 'fetch') {
      exports.fetch(args[1], args[2], args[3]);
    }
    else if (type === 'mount') {
      if (3 < args.length) {
        exports.mount(args[1], args[2], JSON.parse(args[3]));
      }
      else {
        exports.mount(args[1], args[2]);
      }
    }
    else if (type === 'install') {
      if (3 < args.length) {
        exports.install(args[1], args[2], JSON.parse(args[3]));
      }
      else {
        exports.install(args[1], args[2]);
      }
    }
    else if (type === 'unmount') {
      exports.unmount(args[1]);
    }
    else if (type === 'uninstall') {
      exports.uninstall(args[1]);
    }
    else if (type === 'list') {
      if (1 < args.length && args[1] === "prefix") {
        exports.list(true);
      }
      else {
        exports.list();
      }
    }
    else if (type === 'fetched') {
      exports.fetched();
    }
    else if (type === 'available') {
      exports.available();
    }
    else if (type === 'info') {
      exports.info(args[1]);
    }
    else if (type === 'search') {
      exports.search(args[1]);
    }
    else if (type === 'update') {
      exports.update();
    }
    else if (type === 'help') {
      exports.help();
    }
    else {
      arangodb.printf("Unknown command '%s', please try:\n", type);
      cmdUsage();
    }

    return 0;
  }
  catch (err) {
    if (err instanceof ArangoError) {
      arangodb.printf("%s\n", err.errorMessage);
    }
    else {
      arangodb.printf("%s\n", err.message);
    }

    return 1;
  }
};

////////////////////////////////////////////////////////////////////////////////
/// @brief fetches a FOXX application
////////////////////////////////////////////////////////////////////////////////

exports.fetch = function (type, location, version) {
  'use strict';

  var usage = ", usage: fetch(<type>, <location>, [<version>])";

  if (typeof type === "undefined") {
    throwBadParameter("Type missing" + usage);
  }

  if (typeof location === "undefined") {
    throwBadParameter("Location missing" + usage);
  }

  var source = { 
    type: type, 
    location: location, 
    version: version 
  };
  var filename = processSource(source);

  if (typeof source.name === "undefined") {
    throwBadParameter("Name missing for '" + JSON.stringify(source) + "'");
  }

  if (typeof source.version === "undefined") {
    throwBadParameter("Version missing for '" + JSON.stringify(source) + "'");
  }

  var req = {
    name: source.name,
    version: source.version,
    filename: filename
  };

  var res = arango.POST("/_admin/foxx/fetch", JSON.stringify(req));
  arangosh.checkRequestResult(res);

  return { path: res.path, app: res.app };
};

////////////////////////////////////////////////////////////////////////////////
/// @brief mounts a FOXX application
////////////////////////////////////////////////////////////////////////////////

exports.mount = function (appId, mount, options) {
  'use strict';

  var usage = ", usage: mount(<appId>, <mount>, [<options>])";

  if (typeof appId === "undefined") {
    throwBadParameter("AppId missing" + usage);
  }

  if (typeof mount === "undefined") {
    throwBadParameter("Mount missing" + usage);
  }

  var req = {
    appId: appId,
    mount: mount,
    options: options
  };
  
  validateAppName(appId);
  validateMount(mount);

  var res = arango.POST("/_admin/foxx/mount", JSON.stringify(req));
  arangosh.checkRequestResult(res);

  return { appId: res.appId, mountId: res.mountId };
};

////////////////////////////////////////////////////////////////////////////////
/// @brief unmounts a FOXX application
////////////////////////////////////////////////////////////////////////////////

exports.unmount = function (key) {
  'use strict';

  var usage = ", usage: unmount(<mount>)";

  if (typeof key === "undefined") {
    throwBadParameter("Mount point or MountID missing" + usage);
  }

  validateAppName(key);
  
  var req = {
    key: key
  };

  var res = arango.POST("/_admin/foxx/unmount", JSON.stringify(req));
  arangosh.checkRequestResult(res);
  
  arangodb.printf("Application %s unmounted successfully from mount point %s\n", 
                  res.appId, 
                  res.mount);

  return { appId: res.appId, mount: res.mount, collectionPrefix: res.collectionPrefix };
};

////////////////////////////////////////////////////////////////////////////////
/// @brief installs a FOXX application
////////////////////////////////////////////////////////////////////////////////

exports.install = function (name, mount, options) {
  'use strict';

  var usage = ", usage: install(<name>, <mount>, [<options>])";

  if (typeof name === "undefined") {
    throwBadParameter("Name missing" + usage);
  }

  if (typeof mount === "undefined") {
    throwBadParameter("Mount missing" + usage);
  }

  validateMount(mount);

  // .............................................................................
  // latest fishbowl version
  // .............................................................................

  var fishbowl = getFishbowlStorage();
  var available = fishbowl.firstExample({name: name});
  var source = null;
  var version = null;

  if (available !== null) {
    var keys = [];
    var key;

    for (key in available.versions) {
      if (available.versions.hasOwnProperty(key)) {
        keys.push(key);
      }
    }

    keys = keys.sort(module.compareVersions);
    version = keys[keys.length - 1];
    source = available.versions[version];
  }

  // .............................................................................
  // latest fetched version
  // .............................................................................

  var appId = null;
  var aal = getStorage();
  var cursor = aal.byExample({ type: "app", name: name });

  while (cursor.hasNext()) {
    var doc = cursor.next();

    if (module.compareVersions(version, doc.version) <= 0) {
      version = doc.version;
      source = "fetched";
      appId = doc.app;
    }
  }

  // .............................................................................
  // fetched latest version
  // .............................................................................

  if (source === null) {
    throw new Error("Unknown foxx application '%s', use search", name);
  }

  if (source !== "fetched") {
    appId = exports.fetch(source.type, source.location, source.tag).app;
  }

  // .............................................................................
  // install at path
  // .............................................................................

  if (appId === null) {
    throw new Error("Cannot extract application id");
  }

  return exports.mount(appId, mount, options);
};

////////////////////////////////////////////////////////////////////////////////
/// @brief uninstalls a FOXX application
////////////////////////////////////////////////////////////////////////////////

exports.uninstall = function (key) {
  'use strict';

  var usage = ", usage: uninstall(<mount>)";

  if (typeof key === "undefined") {
    throwBadParameter("Mount point or MountID missing" + usage);
  }

  var req = {
    key: key
  };

  validateAppName(key);

  var doc = exports.unmount(key);
  var res = arango.POST("/_admin/foxx/teardown", JSON.stringify(doc));
  arangosh.checkRequestResult(res);

  arangodb.printf("Application uninstalled successfully\n");
};

////////////////////////////////////////////////////////////////////////////////
/// @brief returns all installed FOXX applications
////////////////////////////////////////////////////////////////////////////////

exports.listJson = function (showPrefix) {
  'use strict';

  var aal = getStorage();
  var cursor = aal.byExample({ type: "mount" });
  var result = [];

  while (cursor.hasNext()) {
    var doc = cursor.next();

    var version = doc.app.replace(/^.+:(\d+(\.\d+)*)$/g, "$1"); 

    var res = {
      MountID: doc._key,
      Mount: doc.mount,
      AppID: doc.app,
      Name: doc.name,
      Description: doc.description,
      Author: doc.author,
      System: doc.isSystem ? "yes" : "no",
      Active: doc.active ? "yes" : "no",
      Version: version
    };

    if (showPrefix) {
      res.CollectionPrefix = doc.collectionPrefix;
    }

    result.push(res);
  }

  return result;
};

////////////////////////////////////////////////////////////////////////////////
/// @brief prints all installed FOXX applications
////////////////////////////////////////////////////////////////////////////////

exports.list = function (showPrefix) {
  'use strict';

  var list = exports.listJson(showPrefix);
  var columns = [ "Name", "Author", "Description", "AppID", "Version", "Mount" ];

  if (showPrefix) {
    columns.push("CollectionPrefix");
  }
  columns.push("Active");
  columns.push("System");

  arangodb.printTable(list, columns, { 
    prettyStrings: true, 
    totalString: "%s application(s) found",
    emptyString: "no applications found"
  });
};

////////////////////////////////////////////////////////////////////////////////
/// @brief returns all fetched FOXX applications
////////////////////////////////////////////////////////////////////////////////

exports.fetchedJson = function () {
  'use strict';

  var aal = getStorage();
  var cursor = aal.byExample({ type: "app" });
  var result = [];

  while (cursor.hasNext()) {
    var doc = cursor.next();

    if (doc.isSystem) {
      continue;
    }

    var res = {
      AppID: doc.app,
      Name: doc.name,
      Description: doc.description || "",
      Author: doc.author || "",
      Version: doc.version,
      Path: doc.path
    };

    result.push(res);
  }

  return result;
};

////////////////////////////////////////////////////////////////////////////////
/// @brief prints all fetched FOXX applications
////////////////////////////////////////////////////////////////////////////////

exports.fetched = function () {
  'use strict';

  var list = exports.fetchedJson();

  arangodb.printTable(
    list,
    ["Name", "Author", "Description", "AppID", "Version", "Path"],
    {
      prettyStrings: true, 
      totalString: "%s application(s) found",
      emptyString: "no applications found"
    }
  );
};

////////////////////////////////////////////////////////////////////////////////
/// @brief returns all available FOXX applications
////////////////////////////////////////////////////////////////////////////////

exports.availableJson = function () {
  'use strict';

  var fishbowl = getFishbowlStorage();
  var cursor = fishbowl.all();
  var result = [];

  while (cursor.hasNext()) {
    var doc = cursor.next();

    var maxVersion = "-";
    var versions = Object.keys(doc.versions);
    versions.sort(module.compareVersions);
    if (versions.length > 0) {
      versions.reverse();
      maxVersion = versions[0];
    }

    var res = {
      name: doc.name,
      description: doc.description || "",
      author: doc.author || "",
      latestVersion: maxVersion
    };

    result.push(res);
  }

  return result;
};

////////////////////////////////////////////////////////////////////////////////
/// @brief prints all available FOXX applications
////////////////////////////////////////////////////////////////////////////////

exports.available = function () {
  'use strict';

  var list = exports.availableJson();

  arangodb.printTable(
    list.sort(compareApps),
    [ "name", "author", "description", "latestVersion" ],
    {
      prettyStrings: true, 
      totalString: "%s application(s) found",
      emptyString: "no applications found, please use 'update'",
      rename: {
        "name" : "Name",
        "author" : "Author",
        "description" : "Description",
        "latestVersion" : "Latest Version" 
      }
    }
  );
};

////////////////////////////////////////////////////////////////////////////////
/// @brief info for an available FOXX application
////////////////////////////////////////////////////////////////////////////////

exports.info = function (name) {
  'use strict';

  validateAppName(name);

  var fishbowl = getFishbowlStorage();

  if (fishbowl.count() === 0) {
    arangodb.print("Repository is empty, please use 'update'");
    return;
  }

  var desc;

  try {
    desc = fishbowl.document(name);
  }
  catch (err) {
    arangodb.print("No application '" + name + "' available, please try 'search'");
    return;
  }

  arangodb.printf("Name:        %s\n", desc.name);

  if (desc.hasOwnProperty('author')) {
    arangodb.printf("Author:      %s\n", desc.author);
  }
  
  var isSystem = desc.hasOwnProperty('isSystem') && desc.isSystem;
  arangodb.printf("System:      %s\n", JSON.stringify(isSystem));

  if (desc.hasOwnProperty('description')) {
    arangodb.printf("Description: %s\n\n", desc.description);
  }
  
  var header = false;
  var versions = Object.keys(desc.versions);
  versions.sort(module.compareVersions);

  versions.forEach(function (v) {
    var version = desc.versions[v];
      
    if (! header) {
      arangodb.print("Versions:");
      header = true;
    }

    if (version.type === "github") {
      if (version.hasOwnProperty("tag")) {
        arangodb.printf('%s: fetch github "%s" "%s"\n', v, version.location, version.tag);
      }
      else if (v.hasOwnProperty("branch")) {
        arangodb.printf('%s: fetch github "%s" "%s"\n', v, version.location, version.branch);
      }
      else {
        arangodb.printf('%s: fetch "github" "%s"\n', v, version.location);
      }
    }
  });

  arangodb.printf("\n");
};

////////////////////////////////////////////////////////////////////////////////
/// @brief searchs for an available FOXX applications
////////////////////////////////////////////////////////////////////////////////

exports.search = function (name) {
  'use strict';

  var fishbowl = getFishbowlStorage();

  if (fishbowl.count() === 0) {
    arangodb.print("Repository is empty, please use 'update'");

    return [];
  }

  var docs;

  if (name === undefined || (typeof name === "string" && name.length === 0)) {
    docs = fishbowl.toArray();
  }
  else {

    // get results by looking in "description" attribute
    docs = fishbowl.fulltext("description", "prefix:" + name).toArray();

    // build a hash of keys
    var i;
    var keys = { };

    for (i = 0; i < docs.length; ++i) {
      keys[docs[i]._key] = 1;
    }

    // get results by looking in "name" attribute
    var docs2= fishbowl.fulltext("name", "prefix:" + name).toArray();

    // merge the two result sets, avoiding duplicates
    for (i = 0; i < docs2.length; ++i) {
      if (keys.hasOwnProperty(docs2[i]._key)) {
        continue;
      }

      docs.push(docs2[i]);
    }
  }

  arangodb.printTable(
    docs.sort(compareApps),
    [ "name", "author", "description" ],
    {
      prettyStrings: true, 
      totalString: "%s application(s) found",
      emptyString: "no applications found",
      rename: {
        name : "Name",
        author : "Author",
        description : "Description"
      }
    }
  );
};

////////////////////////////////////////////////////////////////////////////////
/// @brief updates the repository
////////////////////////////////////////////////////////////////////////////////

exports.update = updateFishbowl;

////////////////////////////////////////////////////////////////////////////////
/// @brief outputs the help
////////////////////////////////////////////////////////////////////////////////

exports.help = function () {
  'use strict';

  var commands = {
    "fetch"        : "fetches a foxx application from the central foxx-apps repository into the local repository",
    "mount"        : "mounts a fetched foxx application to a local URL",
    "install"      : "fetches a foxx application from the central foxx-apps repository and mounts it to a local URL",
    "unmount"      : "unmounts a mounted foxx application",
    "uninstall"    : "unmounts a mounted foxx application and calls its teardown method",
    "list"         : "lists all installed foxx applications",
    "fetched"      : "lists all fetched foxx applications that were fetched into the local repository", 
    "available"    : "lists all foxx applications available in the local repository",
    "info"         : "displays information about a foxx application",
    "search"       : "searches the local foxx-apps repository",
    "update"       : "updates the local foxx-apps repository with data from the central foxx-apps repository",
    "help"         : "shows this help"
  };

  arangodb.print("\nThe following commands are available:");

  var c;
  for (c in commands) {
    if (commands.hasOwnProperty(c)) {
      var name = c + "                        ";
      arangodb.printf(" %s %s\n", name.substr(0, 20), commands[c]);
    }
  }
  // additional newline
  arangodb.print();
};

////////////////////////////////////////////////////////////////////////////////
/// @brief sets up a FOXX dev application
////////////////////////////////////////////////////////////////////////////////

exports.devSetup = function (name) {
  'use strict';

  var res;
  var req = {
    name: name
  };
  
  res = arango.POST("/_admin/foxx/dev-setup", JSON.stringify(req));
  arangosh.checkRequestResult(res);
};

////////////////////////////////////////////////////////////////////////////////
/// @brief tears down a FOXX dev application
////////////////////////////////////////////////////////////////////////////////

exports.devTeardown = function (name) {
  'use strict';

  var res;
  var req = {
    name: name
  };
  
  res = arango.POST("/_admin/foxx/dev-teardown", JSON.stringify(req));
  arangosh.checkRequestResult(res);
};

// -----------------------------------------------------------------------------
// --SECTION--                                                       END-OF-FILE
// -----------------------------------------------------------------------------

// Local Variables:
// mode: outline-minor
// outline-regexp: "/// @brief\\|/// @addtogroup\\|/// @page\\|// --SECTION--\\|/// @\\}\\|/\\*jslint"
// End:
