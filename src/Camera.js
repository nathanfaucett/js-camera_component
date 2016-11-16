var sceneGraph = require("@nathanfaucett/scene_graph"),
    isNumber = require("@nathanfaucett/is_number"),
    mathf = require("@nathanfaucett/mathf"),
    vec3 = require("@nathanfaucett/vec3"),
    mat4 = require("@nathanfaucett/mat4"),
    mat32 = require("@nathanfaucett/mat32"),
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

    this._projection2D = mat32.create();
    this._view2D = mat32.create();

    this._needsUpdate = true;
    this._needsUpdate2D = true;

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

    this._needsUpdate = this._needsUpdate2D = true;
    this._active = false;

    return this;
};

CameraPrototype.destructor = function() {

    ComponentPrototype.destructor.call(this);

    color.set(this.background, 0.5, 0.5, 0.5);

    mat4.identity(this._projection);
    mat4.identity(this._view);

    mat32.identity(this._projection2D);
    mat32.identity(this._view2D);

    this._needsUpdate = this._needsUpdate2D = true;
    this._active = false;

    return this;
};

CameraPrototype.set = function(width, height) {

    this.width = width;
    this.height = height;

    this.invWidth = 1 / this.width;
    this.invHeight = 1 / this.height;

    this.aspect = width / height;
    this._needsUpdate = this._needsUpdate2D = true;

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

    this._needsUpdate = this._needsUpdate2D = true;

    return this;
};

CameraPrototype.setHeight = function(height) {

    this.height = height;
    this.aspect = this.width / height;

    this.invHeight = 1 / this.height;

    this._needsUpdate = this._needsUpdate2D = true;

    return this;
};

CameraPrototype.setFov = function(value) {

    this.fov = value;
    this._needsUpdate = this._needsUpdate2D = true;

    return this;
};

CameraPrototype.setNear = function(value) {

    this.near = value;
    this._needsUpdate = this._needsUpdate2D = true;

    return this;
};

CameraPrototype.setFar = function(value) {

    this.far = value;
    this._needsUpdate = this._needsUpdate2D = true;

    return this;
};

CameraPrototype.setOrthographic = function(value) {

    this.orthographic = !!value;
    this._needsUpdate = this._needsUpdate2D = true;

    return this;
};

CameraPrototype.toggleOrthographic = function() {

    this.orthographic = !this.orthographic;
    this._needsUpdate = this._needsUpdate2D = true;

    return this;
};

CameraPrototype.setOrthographicSize = function(size) {

    this.orthographicSize = mathf.clamp(size, this.minOrthographicSize, this.maxOrthographicSize);
    this._needsUpdate = this._needsUpdate2D = true;

    return this;
};

var toWorld_mat = mat4.create();
CameraPrototype.toWorld = function(out, v) {
    var mat = toWorld_mat;

    out[0] = 2.0 * (v[0] * this.invWidth) - 1.0;
    out[1] = -2.0 * (v[1] * this.invHeight) + 1.0;

    mat4.mul(mat, this._projection, this._view);
    vec3.transformMat4(out, out, mat4.inverse(mat, mat));
    out[2] = this.near;

    return out;
};

var toScreen_vec = vec3.create(),
    toScreen_mat = mat4.create();
CameraPrototype.toScreen = function(out, v) {
    var vec = toScreen_vec,
        mat = toScreen_mat;

    vec3.copy(vec, v);

    mat4.mul(mat, this._projection, this._view);
    vec3.transformMat4(out, vec, mat);

    out[0] = ((vec[0] + 1.0) * 0.5) * this.width;
    out[1] = ((1.0 - vec[1]) * 0.5) * this.height;

    return out;
};

CameraPrototype.getView = function() {
    var entity = this.entity,
        transform = entity && (
            entity.getComponent("transform.Transform3D") ||
            entity.getComponent("transform.Transform2D")
        );

    if (transform) {
        mat4.inverse(this._view, transform.getWorldMatrix());
    }

    return this._view;
};

CameraPrototype.getProjection = function() {
    if (this._needsUpdate) {
        this.updateMatrix();
    }
    return this._projection;
};

var getView2D_mat = mat32.create();
CameraPrototype.getView2D = function() {
    var entity = this.entity,
        transform = entity && (
            entity.getComponent("transform.Transform3D") ||
            entity.getComponent("transform.Transform2D")
        );

    if (transform) {
        mat32.inverse(this._view2D,
            mat32.fromMat4(getView2D_mat, transform.getWorldMatrix())
        );
    }

    return this._view2D;
};

CameraPrototype.getProjection2D = function() {
    if (this._needsUpdate2D) {
        this.updateMatrix2D();
    }
    return this._projection2D;
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

                mat4.orthographic(this._projection, top, right, bottom, left, this.near, this.far);
            }

            this._needsUpdate = false;
        }
    }

    return this;
};

CameraPrototype.updateMatrix2D = function(force) {
    var orthographicSize, right, left, top, bottom;

    if (force || this._active) {
        if (this._needsUpdate2D) {
            this.orthographicSize = mathf.clamp(this.orthographicSize, this.minOrthographicSize, this.maxOrthographicSize);

            orthographicSize = this.orthographicSize;
            right = orthographicSize * this.aspect;
            left = -right;
            top = orthographicSize;
            bottom = -top;

            mat32.orthographic(this._projection2D, top, right, bottom, left);
            this._needsUpdate2D = false;
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

    this._needsUpdate = this._needsUpdate2D = true;

    return this;
};