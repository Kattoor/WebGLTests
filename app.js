const vertexShaderText = `
precision mediump float;

attribute vec3 vertPosition;
attribute vec2 vertTexCoord;

varying vec2 fragTexCoord;

uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;

void main()
{
    fragTexCoord = vertTexCoord;
    gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);
}
`;

const fragmentShaderText = `
precision mediump float;

varying vec2 fragTexCoord;

uniform sampler2D sampler;

void main()
{
    gl_FragColor = texture2D(sampler, fragTexCoord);
}
`;

const vec3 = glMatrix.vec3;
const mat4 = glMatrix.mat4;
const toRadian = glMatrix.glMatrix.toRadian;

const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');

gl.enable(gl.DEPTH_TEST); // if we already drew something on a pixel, only draw over it if object is closer to camera
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.BACK);
gl.frontFace(gl.CCW); // polygons are front-facing by setting winding orientation to counter-clock-wise

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderText);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderText);
const program = createProgram(gl, vertexShader, fragmentShader);
validateProgram(gl, program);

const boxVertices = [
    // top
    -1.0, 1.0, -1.0, 0, 0,
    -1.0, 1.0, 1.0, 0, 1,
    1.0, 1.0, 1.0, 1, 1,
    1.0, 1.0, -1.0, 1, 0,

    // left
    -1.0, 1.0, 1.0, 0, 0,
    -1.0, -1.0, 1.0, 1, 0,
    -1.0, -1.0, -1.0, 1, 1,
    -1.0, 1.0, -1.0, 0, 1,

    // right
    1.0, 1.0, 1.0, 1, 1,
    1.0, -1.0, 1.0, 0, 1,
    1.0, -1.0, -1.0, 0, 0,
    1.0, 1.0, -1.0, 1, 0,

    // front
    1.0, 1.0, 1.0, 1, 1,
    1.0, -1.0, 1.0, 1, 0,
    -1.0, -1.0, 1.0, 0, 0,
    -1.0, 1.0, 1.0, 0, 1,

    // back
    1.0, 1.0, -1.0, 0, 0,
    1.0, -1.0, -1.0, 0, 1,
    -1.0, -1.0, -1.0, 1, 1,
    -1.0, 1.0, -1.0, 1, 0,

    // bottom
    -1.0, -1.0, -1.0, 1, 1,
    -1.0, -1.0, 1.0, 1, 0,
    1.0, -1.0, 1.0, 0, 0,
    1.0, -1.0, -1.0, 0, 1
];

const boxIndices = [
    // top
    0, 1, 2,
    0, 2, 3,

    // left
    5, 4, 6,
    6, 4, 7,

    // right
    8, 9, 10,
    8, 10, 11,

    // front
    13, 12, 14,
    15, 14, 12,

    // back
    16, 17, 18,
    16, 18, 19,

    // bottom
    21, 20, 22,
    22, 20, 23
];

createIndexBuffer(gl, boxVertices, boxIndices);

gl.useProgram(program);

setAttribute(gl, program, 'vertPosition', 3, 0);
setAttribute(gl, program, 'vertTexCoord', 2, 3);

const boxTexture = createTexture(gl, document.getElementById('crate-image'));
const stoneTexture = createTexture(gl, document.getElementById('stone-image'));
const dirtTexture = createTexture(gl, document.getElementById('dirt-image'));
const textures = [boxTexture, stoneTexture, dirtTexture];

const worldMatrix = mat4.create();

const viewMatrix = mat4.create();
mat4.lookAt(viewMatrix,
    vec3.fromValues(0, 0, -8),
    vec3.fromValues(0, 0, 0),
    vec3.fromValues(0, 1, 0));

const projectionMatrix = mat4.create();
mat4.perspective(projectionMatrix, toRadian(45), canvas.width / canvas.height, 0.1, 1000.0);

setUniform(gl, program, 'mWorld', worldMatrix);
setUniform(gl, program, 'mView', viewMatrix);
setUniform(gl, program, 'mProj', projectionMatrix);

const identityMatrix = mat4.create();
const xRotationMatrix = mat4.create();
const yRotationMatrix = mat4.create();

let angle = 0;
let lastTextureChangeTimestamp = performance.now();
let currentTexture = 0;
const loop = () => {
    angle = performance.now() / 1000 / 6 * 2 * Math.PI; // full rotation (2*Math.PI) every 6 seconds
    mat4.rotate(xRotationMatrix, identityMatrix, angle / 4, vec3.fromValues(1, 0, 0));
    mat4.rotate(yRotationMatrix, identityMatrix, angle, vec3.fromValues(0, 1, 0));
    mat4.mul(worldMatrix, yRotationMatrix, xRotationMatrix);

    setUniform(gl, program, 'mWorld', worldMatrix);

    gl.clearColor(52 / 255, 152 / 255, 219 / 255, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (performance.now() - lastTextureChangeTimestamp > 1000) {
        lastTextureChangeTimestamp = performance.now();
        currentTexture++;
    }

    gl.bindTexture(gl.TEXTURE_2D, textures[currentTexture % textures.length]);
    gl.activeTexture(gl.TEXTURE0);

    gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(loop);
};
requestAnimationFrame(loop);

/**
 *
 * @param {WebGLRenderingContext} gl
 * @param {GLenum} shaderType
 * @param {string} shaderText
 * @return {WebGLShader}
 */
function createShader(gl, shaderType, shaderText) {
    const shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderText);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(`ERROR compiling shader (${shaderText})!`, gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

/**
 *
 * @param {WebGLRenderingContext} gl
 * @param {WebGLShader} vertexShader
 * @param {WebGLShader} fragmentShader
 * @return {WebGLProgram}
 */
function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('ERROR linking program!', gl.getProgramInfoLog(program));
        return null;
    }
    return program;
}

/**
 *
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgram} program
 */
function validateProgram(gl, program) {
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS))
        console.error('ERROR validating program!', gl.getProgramInfoLog(program));
}

/**
 *
 * @param {WebGLRenderingContext} gl
 * @param {Array.<number>} boxVertices
 * @param {Array.<number>} boxIndices
 */
function createIndexBuffer(gl, boxVertices, boxIndices) {
    const boxVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVertices), gl.STATIC_DRAW);

    const boxIndexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW);
}

/**
 *
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgram} program
 * @param {string} attributeName
 * @param {number} elementsPerAttribute
 * @param {number} offset
 */
function setAttribute(gl, program, attributeName, elementsPerAttribute, offset) {
    const attributeLocation = gl.getAttribLocation(program, attributeName);
    gl.vertexAttribPointer(
        attributeLocation,
        elementsPerAttribute,
        gl.FLOAT,
        false,
        5 * Float32Array.BYTES_PER_ELEMENT,
        offset * Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(attributeLocation);
}

/**
 *
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgram} program
 * @param {string} uniformName
 * @param {Float32List} matrix
 */
function setUniform(gl, program, uniformName, matrix) {
    const uniformLocation = gl.getUniformLocation(program, uniformName);
    gl.uniformMatrix4fv(uniformLocation, false, matrix);
}

/**
 *
 * @param {WebGLRenderingContext} gl
 * @param {TexImageSource} image
 * @returns {WebGLTexture} texture
 */
function createTexture(gl, image) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
}
