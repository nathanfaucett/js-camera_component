var tape = require("tape"),
    sceneGraph = require("@nathanfaucett/scene_graph"),
    transformComponents = require("@nathanfaucett/transform_components"),
    camera = require("..");


var Scene = sceneGraph.Scene,
    Entity = sceneGraph.Entity,
    Transform3D = transformComponents.Transform3D,
    Camera = camera.Camera;


tape("Camera", function(assert) {
    var scene = Scene.create(),
        transform = Transform3D.create(),
        camera = Camera.create(),
        entity = Entity.create().addComponent(transform, camera);

    transform.translate([1, 1, 1]);

    scene.addEntity(entity);

    assert.deepEquals(camera.getProjection(), [
        2.114396572113037, 0, 0, 0,
        0, 3.1715948581695557, 0, 0,
        0, 0, -1.0000076293945312, -1,
        0, 0, -0.1250004768371582, 0
    ]);
    assert.deepEquals(camera.getView(), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -1, -1, -1, 1]);


    assert.deepEquals(camera.getProjection2D(), [
        0.3333333432674408, 0, 0, 0.5, 0, 0
    ]);
    assert.deepEquals(camera.getView2D(), [1, 0, 0, 1, -1, -1]);


    var cameraManager = scene.getComponentManager("camera.Camera");
    assert.equals(cameraManager.getActive(), camera);

    assert.end();
});