var sceneGraph = require("@nathanfaucett/scene_graph"),
    isNumber = require("@nathanfaucett/is_number"),
    mathf = require("@nathanfaucett/mathf"),
    vec3 = require("@nathanfaucett/vec3"),
    mat4 = require("@nathanfaucett/mat4"),
    color = require("@nathanfaucett/color"),
    isNullOrUndefined = require("@nathanfaucett/is_null_or_undefined"),
    CameraManager = require("./CameraManager");


var Component = sceneGraph.Component,
    ComponentPrototype = Component.prototype,
    CameraPrototype;


module.exports = Camera;


function Camera() {

    Component.call(this);

    this.width = 960;
    this.height = 640;
    this.invWidth = 1 / this.width;
    this.invHeight = 1 / this.height;

    this.autoResize = true;
    this.background = color.create(0.5, 0.5, 0.5);

    this.aspect = this.width / this.height;
    this.fov = 35;

    this.near = 0.0625;
    this.far = 16384;

    this.orthographic = false;
    this.orthographicSize = 2;

    this.minOrthographicSize = mathf.EPSILON;
    this.maxOrthographicSize = 1024;

    this._projection = mat4.create();
    this._view = mat4.create();

    this._needsUpdate = true;
    this._active = false;
}
Component.extend(Camera, "camera.Camera", CameraManager);
CameraPrototype = Camera.prototype;

CameraPrototype.construct = function(options) {

    ComponentPrototype.construct.call(this);

    options = options || {};

    this.width = isNumber(options.width) ? options.width : 960;
    this.height = isNumber(options.height) ? options.height : 640;
    this.invWidth = 1 / this.width;
    this.invHeight = 1 / this.height;

    this.autoResize = isNullOrUndefined(options.autoResize) ? true : !!options.autoResize;
    if (options.background) {
        color.copy(this.background, options.background);
    }

    this.aspect = this.width / this.height;
    this.fov = isNumber(options.fov) ? options.fov : 35;

    this.near = isNumber(options.near) ? options.near : 0.0625;
    this.far = isNumber(options.far) ? options.far : 16384;

    this.orthographic = isNullOrUndefined(options.orthographic) ? false : !!options.orthographic;
    this.orthographicSize = isNumber(options.orthographicSize) ? options.orthographicSize : 2;

    this._needsUpdate = true;
    this._active = false;

    return this;
};

CameraPrototype.destructor = function() {

    ComponentPrototype.destructor.call(this);

    color.set(this.background, 0.5, 0.5, 0.5);

    mat4.identity(this._projection);
    mat4.identity(this._view);

    this._needsUpdate = true;
    this._active = false;

    return this;
};

CameraPrototype.set = function(width, height) {

    this.width = width;
    this.height = height;

    this.invWidth = 1 / this.width;
    this.invHeight = 1 / this.height;

    this.aspect = width / height;
    this._needsUpdate = true;

    return this;
};

CameraPrototype.setActive = function() {
    var manager = this.manager;

    if (manager) {
        manager.setActive(this);
    } else {
        this._active = true;
    }

    return this;
};

CameraPrototype.setWidth = function(width) {

    this.width = width;
    this.aspect = width / this.height;

    this.invWidth = 1 / this.width;

    this._needsUpdate = true;

    return this;
};

CameraPrototype.setHeight = function(height) {

    this.height = height;
    this.aspect = this.width / height;

    this.invHeight = 1 / this.height;

    this._needsUpdate = true;

    return this;
};

CameraPrototype.setFov = function(value) {

    this.fov = value;
    this._needsUpdate = true;

    return this;
};

CameraPrototype.setNear = function(value) {

    this.near = value;
    this._needsUpdate = true;

    return this;
};

CameraPrototype.setFar = function(value) {

    this.far = value;
    this._needsUpdate = true;

    return this;
};

CameraPrototype.setOrthographic = function(value) {

    this.orthographic = !!value;
    this._needsUpdate = true;

    return this;
};

CameraPrototype.toggleOrthographic = function() {

    this.orthographic = !this.orthographic;
    this._needsUpdate = true;

    return this;
};

CameraPrototype.setOrthographicSize = function(size) {

    this.orthographicSize = mathf.clamp(size, this.minOrthographicSize, this.maxOrthographicSize);
    this._needsUpdate = true;

    return this;
};

var MAT4 = mat4.create(),
    VEC3 = vec3.create();

CameraPrototype.toWorld = function(out, v) {
    out[0] = 2.0 * (v[0] * this.invWidth) - 1.0;
    out[1] = -2.0 * (v[1] * this.invHeight) + 1.0;

    mat4.mul(MAT4, this._projection, this._view);
    vec3.transformMat4(out, out, mat4.inverse(MAT4, MAT4));
    out[2] = this.near;

    return out;
};


CameraPrototype.toScreen = function(out, v) {
    vec3.copy(VEC3, v);

    mat4.mul(MAT4, this._projection, this._view);
    vec3.transformMat4(out, VEC3, MAT4);

    out[0] = ((VEC3[0] + 1.0) * 0.5) * this.width;
    out[1] = ((1.0 - VEC3[1]) * 0.5) * this.height;

    return out;
};

CameraPrototype.getView = function() {
    if (this._needsUpdate) {
        this.updateMatrix();
    }
    return this._view;
};

CameraPrototype.getProjection = function() {
    if (this._needsUpdate) {
        this.updateMatrix();
    }
    return this._projection;
};

CameraPrototype.updateMatrix = function(force) {
    var orthographicSize, right, left, top, bottom;

    if (force || this._active) {
        if (this._needsUpdate) {
            if (!this.orthographic) {
                mat4.perspective(this._projection, mathf.degsToRads(this.fov), this.aspect, this.near, this.far);
            } else {
                this.orthographicSize = mathf.clamp(this.orthographicSize, this.minOrthographicSize, this.maxOrthographicSize);

                orthographicSize = this.orthographicSize;
                right = orthographicSize * this.aspect;
                left = -right;
                top = orthographicSize;
                bottom = -top;

                mat4.orthographic(this._projection, left, right, top, bottom, this.near, this.far);
            }

            this._needsUpdate = false;
        }
    }

    return this;
};

CameraPrototype.toJSON = function(json) {

    json = ComponentPrototype.toJSON.call(this, json);

    json._active = this._active;

    json.width = this.width;
    json.height = this.height;
    json.aspect = this.aspect;

    json.autoResize = this.autoResize;
    json.background = color.copy(json.background || [], this.background);

    json.far = this.far;
    json.near = this.near;
    json.fov = this.fov;

    json.orthographic = this.orthographic;
    json.orthographicSize = this.orthographicSize;
    json.minOrthographicSize = this.minOrthographicSize;
    json.maxOrthographicSize = this.maxOrthographicSize;

    return json;
};

CameraPrototype.fromJSON = function(json) {

    ComponentPrototype.fromJSON.call(this, json);

    this._active = json._active;

    this.width = json.width;
    this.height = json.height;
    this.aspect = json.aspect;

    this.autoResize = json.autoResize;
    color.copy(this.background, json.background);

    this.far = json.far;
    this.near = json.near;
    this.fov = json.fov;

    this.orthographic = json.orthographic;
    this.orthographicSize = json.orthographicSize;
    this.minOrthographicSize = json.minOrthographicSize;
    this.maxOrthographicSize = json.maxOrthographicSize;

    this._needsUpdate = true;

    return this;
};