var sceneGraph = require("@nathanfaucett/scene_graph");


var ComponentManager = sceneGraph.ComponentManager,
    ComponentManagerPrototype = ComponentManager.prototype,
    CameraManagerPrototype;


module.exports = CameraManager;


function CameraManager() {

    ComponentManager.call(this);

    this._active = null;
}
ComponentManager.extend(CameraManager, "camera.CameraManager");
CameraManagerPrototype = CameraManager.prototype;

CameraManagerPrototype.construct = function() {

    ComponentManagerPrototype.construct.call(this);

    return this;
};

CameraManagerPrototype.destructor = function() {

    ComponentManagerPrototype.destructor.call(this);

    this._active = null;

    return this;
};

CameraManagerPrototype.sortFunction = function(a, b) {
    return a._active ? 1 : (b._active ? -1 : 0);
};

CameraManagerPrototype.setActive = function(camera) {
    if (this._active) {
        this._active._active = false;
    }

    camera._active = true;
    this._active = camera;

    this.sort();

    return this;
};

CameraManagerPrototype.getActive = function() {
    return this._active;
};

CameraManagerPrototype.addComponent = function(component) {

    ComponentManagerPrototype.addComponent.call(this, component);

    if (component._active || !this._active) {
        this.setActive(component);
    }

    return this;
};

CameraManagerPrototype.removeComponent = function(component) {

    ComponentManagerPrototype.removeComponent.call(this, component);

    if (component._active) {
        this._active = null;
    }

    return this;
};