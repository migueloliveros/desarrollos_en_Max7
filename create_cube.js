autowatch = 1;
outlets = 2;

var vertMat = new JitterMatrix("vertMat");
var indexMat = new JitterMatrix("indexMat");
var normMat = new JitterMatrix("normMat");

vertMat.dim = 1;
vertMat.planecount = 3;
vertMat.type = "float32";

indexMat.dim = 1;
indexMat.planecount = 1;
indexMat.type = "long";

normMat.dim = 1;
normMat.planecount = 3;
normMat.type = "float32";


function generate(xSize, ySize, zSize) {
    vertMat.clear();
    indexMat.clear();
    normMat.clear();
    createVertices(xSize, ySize, zSize);
    createTriangles(xSize, ySize, zSize);
    outlet(0, "jit_matrix " + vertMat.name);
    outlet(1, "jit_matrix " + indexMat.name);
}

function createVertices(xSize, ySize, zSize) {
	var cornerVertices = 8;
 	var edgeVertices = (xSize + ySize + zSize - 3) * 4;
	var faceVertices = (
		(xSize - 1) * (ySize - 1) +
		(xSize - 1) * (zSize - 1) +
        (ySize - 1) * (zSize - 1)) * 2;
        
    vertMat.dim = cornerVertices + edgeVertices + faceVertices;
    normMat.dim = vertMat.dim;
    
    var v = 0;
    for (var y = 0; y <= ySize; y++) {
        var yScaled = (y / ySize) * 2 -1;
        for (var x = 0; x <= xSize; x++) {
            vertMat.setcell1d(v++, (x/xSize)*2 - 1, yScaled, -1);
        }
        for (var z = 1; z <= zSize; z++) {
            vertMat.setcell1d(v++, (xSize/xSize)*2 - 1, yScaled, (z/zSize)*2 -1);
        }
        for (var x = xSize - 1; x >= 0; x--) {
            vertMat.setcell1d(v++, (x/xSize)*2 - 1, yScaled, (zSize/zSize)*2 -1);
        }
        for (var z = zSize - 1; z > 0; z--) {
            vertMat.setcell1d(v++, -1, yScaled, (z/zSize)*2 -1);
        }
    }

    for (var z = 1; z < zSize; z++) {
        for (var x = 1; x < xSize; x++) {
            vertMat.setcell1d(v++, (x/xSize)*2-1, ySize/ySize, (z/zSize)*2 -1);
        }
    }
    for (var z = 1; z < zSize; z++) {
        for (var x = 1; x < xSize; x++) {
            vertMat.setcell1d(v++,  (x/xSize)*2-1, -1, (z/zSize)*2 -1);
        }
    }
}

function createTriangles(xSize, ySize, zSize) {
    var quads = (xSize * ySize + xSize * zSize + ySize * zSize) * 2;
    
    indexMat.dim = quads*6;

    var ring = (xSize + zSize) * 2;
    var t = 0, v = 0;
    for (var y = 0; y < ySize; y++, v++) {
        for (var q = 0; q < ring-1; q++, v++) {
            t = SetQuad(t, v, v + 1, v + ring, v + ring + 1);
        }
        t = SetQuad(t, v, v - ring + 1, v + ring, v + 1);
    }

    t = CreateTopFace(t, ring, xSize, ySize, zSize);
    t = CreateBottomFace(t, ring, xSize, ySize, zSize);

}

function SetQuad (i, v00, v10, v01, v11) {
    indexMat.setcell1d(i, v00);
    indexMat.setcell1d(i + 1, v01);
    indexMat.setcell1d(i + 4, v01);
    indexMat.setcell1d(i+2, v10);
    indexMat.setcell1d(i+3, v10);
    indexMat.setcell1d(i+5, v11);

    return i + 6;
}

function CreateTopFace (t, ring, xSize, ySize, zSize) {
    var v = ring * ySize;
    for (var x = 0; x < xSize - 1; x++, v++) {
        t = SetQuad(t, v, v + 1, v + ring - 1, v + ring); // lato dietro
    }
    t = SetQuad(t, v, v + 1, v + ring - 1, v + 2);

    var vMin = ring * (ySize + 1) - 1;
    var vMid = vMin + 1;
    var vMax = v + 2;

    for (var z = 1; z < zSize - 1; z++, vMin--, vMid++, vMax++) {
        t = SetQuad(t, vMin, vMid, vMin - 1, vMid + xSize - 1); // lato sinistro
        for (var x = 1; x < xSize - 1; x++, vMid++) {
            t = SetQuad(   // dentro
                t,
                vMid, vMid + 1, vMid + xSize - 1, vMid + xSize);
        }
        t = SetQuad(t, vMid, vMax, vMid + xSize - 1, vMax + 1); // lato destro
    }
    var vTop = vMin - 2;
    t = SetQuad(t, vMin, vMid, vTop + 1, vTop); // quadrato basso sinistra
    for (var x = 1; x < xSize - 1; x++, vTop--, vMid++) {
        t = SetQuad(t, vMid, vMid + 1, vTop, vTop - 1);
    }
    t = SetQuad(t, vMid, vTop - 2, vTop, vTop - 1); // quadrato basso destra

    return t;
}

function CreateBottomFace (t, ring, xSize, ySize, zSize) {
    var v = 1;
    var vMid = vertMat.dim - (xSize - 1) * (zSize - 1);
    t = SetQuad(t, ring - 1, vMid, 0, 1);
    for (var x = 1; x < xSize - 1; x++, v++, vMid++) {
        t = SetQuad(t, vMid, vMid + 1, v, v + 1);
    }
    t = SetQuad(t, vMid, v + 2, v, v + 1);

    var vMin = ring - 2;
    vMid -= xSize - 2;
    var vMax = v + 2;

    for (var z = 1; z < zSize - 1; z++, vMin--, vMid++, vMax++) {
        t = SetQuad(t, vMin, vMid + xSize - 1, vMin + 1, vMid);
        for (var x = 1; x < xSize - 1; x++, vMid++) {
            t = SetQuad(
                t,
                vMid + xSize - 1, vMid + xSize, vMid, vMid + 1);
        }
        t = SetQuad(t, vMid + xSize - 1, vMax + 1, vMid, vMax);
    }

    var vTop = vMin - 1;
    t = SetQuad(t, vTop + 1, vTop, vTop + 2, vMid);
    for (var x = 1; x < xSize - 1; x++, vTop--, vMid++) {
        t = SetQuad(t, vTop, vTop - 1, vMid, vMid + 1);
    }
    t = SetQuad(t, vTop, vTop - 1, vMid, vTop - 2);
    
    return t;
}