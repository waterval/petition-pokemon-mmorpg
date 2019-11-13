const canvas = $("canvas");
let c;
if (canvas[0]) {
    c = canvas[0].getContext("2d");
}

let canvasX, canvasY, pointerX, pointerY, currentX, currentY, isDrawing;

canvas.on("mousedown", function(event) {
    isDrawing = true;
    canvasX = canvas.offset().left;
    canvasY = canvas.offset().top;
    pointerX = event.clientX - canvasX;
    pointerY = event.clientY - canvasY;
    c.strokeStyle = "white";
    c.lineWidth = "1";
    c.beginPath();
    c.moveTo(pointerX, pointerY);
});

canvas.on("mousemove", function(event) {
    if (isDrawing) {
        currentX = event.clientX - canvasX;
        currentY = event.clientY - canvasY;
        c.lineTo(currentX, currentY);
        c.stroke();
    }
});

canvas.on("mouseup", function() {
    isDrawing = false;
    let signatureUrl = document.getElementById("canvas").toDataURL();
    $("#signature").val(signatureUrl);
});
