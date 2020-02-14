const vertexShaderText = `
precision mediump float;

attribute vec3 vertPosition;
attribute vec3 vertColor;

varying vec3 fragColor;

uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;

void main()
{
    fragColor = vertColor;
    gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);
}
`;

const fragmentShaderText = `
precision mediump float;

varying vec3 fragColor;

void main()
{
    gl_FragColor = vec4(fragColor, 1.0);
}
`;

const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');

const vec3 = glMatrix.vec3;
const mat4 = glMatrix.mat4;
const toRadian = glMatrix.glMatrix.toRadian;

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderText);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderText);
const program = createProgram(gl, vertexShader, fragmentShader);
validateProgram(gl, program);

createBuffer(gl,
    [
        // x, y, z, r, g, b
        0.0, 0.5, 0.0, 1.0, 0.0, 0.0,
        -0.5, -0.5, 0.0, 0.0, 1.0, 0.0,
        0.5, -0.5, 0.0, 0.0, 0.0, 1.0]);

gl.useProgram(program);

setAttribute(gl, program, 'vertPosition', 3, 0);
setAttribute(gl, program, 'vertColor', 3, 3);

const worldMatrix = mat4.create();

const viewMatrix = mat4.create();
mat4.lookAt(viewMatrix,
    vec3.fromValues(0, 0, -2),
    vec3.fromValues(0, 0, 0),
    vec3.fromValues(0, 1, 0));

const projectionMatrix = mat4.create();
mat4.perspective(projectionMatrix, toRadian(45), canvas.width / canvas.height, 0.1, 1000.0);

setUniform(gl, program, 'mWorld', worldMatrix);
setUniform(gl, program, 'mView', viewMatrix);
setUniform(gl, program, 'mProj', projectionMatrix);

const identityMatrix = mat4.create();
let angle = 0;
const loop = () => {
    angle = performance.now() / 1000 / 6 * 2 * Math.PI; // full rotation (2*Math.PI) every 6 seconds
    mat4.rotate(worldMatrix, identityMatrix, angle, vec3.fromValues(0, 1, 0));
    setUniform(gl, program, 'mWorld', worldMatrix);

    gl.clearColor(52 / 255, 152 / 255, 219 / 255, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

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
 * @param {Array.<number>} data
 */
function createBuffer(gl, data) {
    const triangleVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
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
        6 * Float32Array.BYTES_PER_ELEMENT,
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
