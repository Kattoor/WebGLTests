const vertexShaderText = `
precision mediump float;

attribute vec2 vertPosition;
attribute vec3 vertColor;

varying vec3 fragColor;

void main()
{
    fragColor = vertColor;
    gl_Position = vec4(vertPosition, 0.0, 1.0);
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

gl.clearColor(52 / 255, 152 / 255, 219 / 255, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderText);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderText);
const program = createProgram(gl, vertexShader, fragmentShader);
validateProgram(gl, program);

createBuffer(gl,
    [
        // x, y, r, g, b
        0.0, 0.5, 1.0, 0.0, 0.0,
        -0.5, -0.5, 0.0, 1.0, 0.0,
        0.5, -0.5, 0.0, 0.0, 1.0]);

setAttribute(gl, program, 'vertPosition', 2, 0);
setAttribute(gl, program, 'vertColor', 3, 2);

gl.useProgram(program);
gl.drawArrays(gl.TRIANGLES, 0, 3);


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
        gl.FLOAT, // type of elements
        false,
        5 * Float32Array.BYTES_PER_ELEMENT, // size of an individual vertex
        offset * Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(attributeLocation);
}