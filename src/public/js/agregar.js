$(document).ready(function () {
    var counter = 0;

    $("#addrow").on("click", function () {
        console.log("entro");
        var newRow = $("<tr>");
        var cols = "";

        cols += '<td><input type="text" class="form-control" name="name' + counter + '" required/></td>';
        cols += '<td><input type="number" class="form-control" name="nota' + counter + '" required/></td>';

        cols += '<td><input type="button" class="ibtnDel btn btn-md btn-danger "  value="Borrar"></td>';
        newRow.append(cols);
        $("table.order-list").append(newRow);
        counter++;
    });


    $("table.order-list").on("click", ".ibtnDel", function (event) {
        $(this).closest("tr").remove();       
        counter -= 1
    });


});

function del(id){
    console.log(id);
    $.ajax({
        url: '/proyectos/eliminarInt',
        data: 'id='+id,
        type: 'get',
        success:function(){
            console.log("anduvo");
        }
    });
}


function calculateRow(row) {
    var price = +row.find('input[name^="price"]').val();

}

function calculateGrandTotal() {
    var grandTotal = 0;
    $("table.order-list").find('input[name^="price"]').each(function () {
        grandTotal += +$(this).val();
    });
    $("#grandtotal").text(grandTotal.toFixed(2));
}