FunctionResponse = function(functionName, params) {
    this.functionName = functionName;
    this.params = params;
}

FunctionResponse.prototype.setErr = function(err) {
    this.err = err;
}

FunctionResponse.prototype.setData = function(data) {
    this.data = data;
}

