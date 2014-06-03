<a name="details_on_foxxcontroller"></a>
# Details on FoxxController

`New FoxxController(applicationContext, options)`

This creates a new Controller. The first argument is the controller context available in the variable applicationContext. The second one is an options array with the following attributes:

* urlPrefix: All routes you define within will be prefixed with it.

*Examples*

	app = new Controller(applicationContext, {
		urlPrefix: "/meadow"
	});	


<!--
@copydetails JSF_foxx_controller_initializer
-->
	
<a name="http_methods"></a>
### HTTP Methods

<a name="get"></a>
#### Get

`FoxxController::get(path, callback)`

This handles requests from the HTTP verb get.

When defining a route you can also define a so called 'parameterized' path like /goose/:barn. In this case you can later get the value the user provided for barn via the params function (see the Request object).

*Examples*

	app.get('/goose/barn', function (req, res) {
		// Take this request and deal with it!
	});

<a name="head"></a>
#### Head

`FoxxController::head(path, callback)`

This handles requests from the HTTP verb head. You have to give a function as callback. It will get a request and response object as its arguments

<a name="post"></a>
#### Post

`FoxxController::post(path, callback)`

This handles requests from the HTTP verb post. See above for the arguments you can give.

*Examples*

	app.post('/goose/barn', function (req, res) {
		// Take this request and deal with it!
	});

<a name="put"></a>
#### Put

`FoxxController::put(path, callback)`

This handles requests from the HTTP verb put. See above for the arguments you can give.

*Examples*

	app.put('/goose/barn', function (req, res) {
		// Take this request and deal with it!
	});

<a name="patch"></a>
#### Patch

`FoxxController::patch(path, callback)`

This handles requests from the HTTP verb patch. See above for the arguments you can give.

*Examples*

	app.patch('/goose/barn', function (req, res) {
		// Take this request and deal with it!
	});

<a name="delete"></a>
#### Delete

`FoxxController::delete(path, callback)`

This handles requests from the HTTP verb delete. See above for the arguments you can give.

**Warning**
Do not forget that delete is a reserved word in JavaScript and therefore needs to be called as app['delete']. There is also an alias del for this very reason.



<!--

### Get

@copydetails JSF_foxx_controller_get

### Head

@copydetails JSF_foxx_controller_head

### Post

@copydetails JSF_foxx_controller_post

### Put

@copydetails JSF_foxx_controller_put

### Patch

@copydetails JSF_foxx_controller_patch

### Delete

@copydetails JSF_foxx_controller_delete

-->
<a name="documenting_and_constraining_a_specific_route"></a>
### Documenting and constraining a specific route

If you now want to document your route, you can use JSDoc style comments (a 
multiline comment block with the first line starting with `/**` instead 
of `/*`) above your routes to do that:

	/** Get all foxxes
	  * 
	  * If you want to get all foxxes, please use this
	  * method to do that.
	  */
	app.get("/foxxes", function () {
	  // ...
	});

<!--
@verbinclude foxx-doc-comment
-->

The first line will be treated as a summary (For optical reasons in the 
produced documentation, the summary is restricted to 60 characters). All 
following lines will be treated as additional notes shown in the detailed 
view of the route documentation. With the provided information, Foxx will 
generate a nice documentation for you. Furthermore you can describe your 
API by chaining the following methods onto your path definition:

<a name="path_param"></a>
#### Path Param

If you defined a route "/foxx/:id", you can constrain which format a path parameter (/foxx/12) can have by giving it a type. We currently support the following types:

* int
* string
You can also provide a description of this parameter.

*Examples*

	app.get("/foxx/:id", function {
		// Do something
	}).pathParam("id", {
		description: "Id of the Foxx",
		type: "int"
	});

<a name="query_param"></a>
#### Query Param

	FoxxController::queryParam(id, options)

Describe a query parameter:

If you defined a route "/foxx", you can constrain which format a query parameter (/foxx?a=12) can have by giving it a type. We currently support the following types:

* int
* string
You can also provide a description of this parameter, if it is required and if you can provide the parameter multiple times.

*Examples*

	app.get("/foxx", function {
	// Do something
	}).queryParam("id", {
	description: "Id of the Foxx",
	type: "int",
	required: true,
	allowMultiple: false
	});

<a name="body_param"></a>
#### Body Param

`FoxxController::bodyParam(paramName, description, Model)`

Expect the body of the request to be a JSON with the attributes you annotated in your model. It will appear alongside the provided description in your Documentation. This will initialize a Model with the data and provide it to you via the params as paramName. For information about how to annotate your models, see the Model section.

*Error Response*

`FoxxController::errorResponse(errorClass, code, description)`

Define a reaction to a thrown error for this route: If your handler throws an error of the defined errorClass, it will be caught and the response will have the given status code and a JSON with error set to your description as the body.

If you want more control over the returned JSON, you can give an optional fourth parameter in form of a function. It gets the error as an argument, the return value will transformed into JSON and then be used as the body. The status code will be used as described above. The description will be used for the documentation.

It also adds documentation for this error response to the generated documentation.

*Examples*

	/* define our own error type, FoxxyError */
	var FoxxyError = function (message) {
	this.message = "the following FoxxyError occurred: ' + message;
	};
	FoxxyError.prototype = new Error();
	app.get("/foxx", function {
	/* throws a FoxxyError */
	throw new FoxxyError();
	}).errorResponse(FoxxyError, 303, "This went completely wrong. Sorry!");
	app.get("/foxx", function {
	throw new FoxxyError("oops!");
	}).errorResponse(FoxxyError, 303, "This went completely wrong. Sorry!", function (e) {
		return {
			code: 123,
			desc: e.message
		};
	});

<a name="onlyif"></a>
#### onlyIf

`FoxxController::onlyIf(check)`

Provide it with a function that throws an exception if the normal processing should not be executed. Provide an errorResponse to define the behavior in this case. This can be used for authentication or authorization for example.

*Examples*

	app.get("/foxx", function {
	// Do something
	}).onlyIf(aFunction).errorResponse(ErrorClass, 303, "This went completely wrong. Sorry!");

<a name="onlyifauthenticated"></a>
#### onlyIfAuthenticated

`FoxxController::onlyIf(code, reason)`

Please activate authentification for this app if you want to use this function. If the user is logged in, it will do nothing. Otherwise it will respond with the status code and the reason you provided (the route handler won't be called). This will also add the according documentation for this route.

*Examples*

	app.get("/foxx", function {
		// Do something
	}).onlyIfAuthenticated(401, "You need to be authenticated");


<!--
### Path Param

@copydetails JSF_foxx_RequestContext_pathParam

### Query Param

@copydetails JSF_foxx_RequestContext_queryParam

### Body Param

@copydetails JSF_foxx_RequestContext_bodyParam

### Error Response

@copydetails JSF_foxx_RequestContext_errorResponse

### onlyIf

@copydetails JSF_foxx_RequestContext_onlyIf

### onlyIfAuthenticated

@copydetails JSF_foxx_RequestContext_onlyIfAuthenticated
-->
<a name="documenting_and_constraining_all_routes_of_a_controller"></a>
### Documenting and constraining all routes of a controller

In addition to documenting a specific route, you can also
do the same for all routes of a controller. For this purpose
use the `allRoutes` object of the according controller.
The following methods are available:

*Error Response*

`RequestContextBuffer::errorResponse(errorClass, code, description)`

Defines an errorResponse for all routes of this controller. For details on errorResponse see the according method on routes.

*Examples*

	app.allroutes.errorResponse(FoxxyError, 303, "This went completely wrong. Sorry!");
	app.get("/foxx", function {
		// Do something
	});
	onlyIf

`RequestContextBuffer::onlyIf(code, reason)`

Defines an onlyIf for all routes of this controller. For details on onlyIf see the according method on routes.

*Examples*

	app.allroutes.onlyIf(myPersonalCheck);
	app.get("/foxx", function {
		// Do something
	});
	onlyIfAuthenticated

RequestContextBuffer::errorResponse(errorClass, code, description)
Defines an onlyIfAuthenticated for all routes of this controller. For details on onlyIfAuthenticated see the according method on routes.

*Examples*

	app.allroutes.onlyIfAuthenticated(401, "You need to be authenticated");
	app.get("/foxx", function {
		// Do something
	});


<!--
### Error Response

@copydetails JSF_foxx_RequestContextBuffer_errorResponse

### onlyIf

@copydetails JSF_foxx_RequestContextBuffer_onlyIf

### onlyIfAuthenticated

@copydetails JSF_foxx_RequestContextBuffer_onlyIfAuthenticated
-->
<a name="before_and_after_hooks"></a>
### Before and After Hooks

You can use the following two functions to do something before or respectively 
after the normal routing process is happening. You could use that for logging 
or to manipulate the request or response (translate it to a certain format for 
example).

<a name="before"></a>
#### Before

`FoxxController::before(path, callback)`

The before function takes a path on which it should watch and a function that it should execute before the routing takes place. If you do omit the path, the function will be executed before each request, no matter the path. Your function gets a Request and a Response object.

*Examples*

	app.before('/high/way', function(req, res) {
		//Do some crazy request logging
	});

<a name="after"></a>
#### After

`FoxxController::after(path, callback)`

This works pretty similar to the before function. But it acts after the execution of the handlers (Big surprise, I suppose).

*Examples*

	app.after('/high/way', function(req, res) {
		//Do some crazy response logging
	});

<!--
### Before

@copydetails JSF_foxx_controller_before

### After

@copydetails JSF_foxx_controller_after
-->

<a name="the_request_and_response_objects"></a>
## The Request and Response Objects

When you have created your FoxxController you can now define routes on it. 
You provide each with a function that will handle the request. It gets two 
arguments (four, to be honest. But the other two are not relevant for now):

* The `request` object
* The `response` object

These objects are provided by the underlying ArangoDB actions and enhanced 
by the `BaseMiddleware` provided by Foxx.

<a name="the_request_object"></a>
### The Request Object


The `request` object inherits several attributes from the underlying Actions:

* `compatibility`: an integer specifying the compatibility version sent by the
  client (in request header `x-arango-version`). If the client does not send this
  header, ArangoDB will set this to the minimum compatible version number. The 
  value is 10000 * major + 100 * minor (e.g. `10400` for ArangoDB version 1.4).

* `user`: the name of the current ArangoDB user. This will be populated only
  if authentication is turned on, and will be `null` otherwise.

* `database`: the name of the current database (e.g. `_system`)

* `protocol`: `http` or `https`
    
* `server`: a JSON object with sub-attributes `address` (containing server 
  host name or IP address) and `port` (server port).

* `path`: request URI path, with potential database name stripped off.

* `url`: request URI path + query string, with potential database name 
   stripped off

* `headers`: a JSON object with the request headers as key/value pairs
    
* `cookies`: a JSON object with the request cookies as key/value pairs

* `requestType`: the request method (e.g. "GET", "POST", "PUT", ...)

* `requestBody`: the complete body of the request as a string

* `parameters`: a JSON object with all parameters set in the URL as key/value
  pairs

* `urlParameters`: a JSON object with all named parameters defined for the
  route as key/value pairs.

In addition to these attributes, a Foxx request objects provides the following
convenience methods:

<a name="body"></a>
#### Body

`request.body()`

Get the JSON parsed body of the request. If you need the raw version, please refer to the rawBody function.

<a name="raw_body"></a>
#### Raw Body

`request.rawBody()`

The raw request body, not parsed. Just a String.

<a name="params"></a>
#### Params

`request.params(key)`

Get the parameters of the request. This process is two-fold:

If you have defined an URL like /test/:id and the user requested /test/1, the call params("id") will return 1.
If you have defined an URL like /test and the user gives a query component, the query parameters will also be returned. So for example if the user requested /test?a=2, the call params("a") will return 2.

<!--
### Body

@copydetails JSF_foxx_BaseMiddleware_request_body

### Raw Body

@copydetails JSF_foxx_BaseMiddleware_request_rawBody

### Params

@copydetails JSF_foxx_BaseMiddleware_request_params
-->

<a name="the_response_object"></a>
### The Response Object

Every response object has the body attribute from the underlying Actions
to set the raw body by hand.

You provide your response body as a string here.

<a name="status"></a>
#### Status

`response.status(code)`

Set the status code of your response.

*Examples*

	response.status(404);

<a name="set"></a>
#### Set

`response.set(key, value)`

Set a header attribute.

*Examples*

	response.set("Content-Length", 123);
	response.set("Content-Type", "text/plain");
	// or alternatively:
	response.set({
		"Content-Length": "123",
		"Content-Type": "text/plain"
	});

<a name="json"></a>
#### JSON

`response.json(object)`

Set the content type to JSON and the body to the JSON encoded object you provided.

*Examples*

	response.json({'born': 'December 12, 1915'});

<!--
### Status

@copydetails JSF_foxx_BaseMiddleware_response_status

### Set

@copydetails JSF_foxx_BaseMiddleware_response_set

### JSON

@copydetails JSF_foxx_BaseMiddleware_response_json

-->