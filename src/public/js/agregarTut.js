$(document).ready(function () {
    var counter = 0;

    $("#addTutor").on("click", function () {
        var newRow = $("<tr>");
        var cols = "";

        cols += '<td><input type="text" class="form-control" name="nombreC' + counter + '" required/></td>';
        cols += '<td><input type="text" class="form-control" name="cargo' + counter + '" required/></td>';
        cols += '<td><input type="text" class="form-control" name="emprTut' + counter + '" required/></td>';

        cols += '<td><input type="button" class="ibtnDel btn btn-md btn-danger "  value="Borrar"></td>';
        newRow.append(cols);
        $("table.order-list2").append(newRow);
        counter++;
    });



    $("table.order-list2").on("click", ".ibtnDel", function (event) {
        $(this).closest("tr").remove();       
        counter -= 1
    });


});



function calculateRow(row) {
    var price = +row.find('input[name^="price"]').val();

}

function calculateGrandTotal() {
    var grandTotal = 0;
    $("table.order-list2").find('input[name^="price"]').each(function () {
        grandTotal += +$(this).val();
    });
    $("#grandtotal").text(grandTotal.toFixed(2));
}

 