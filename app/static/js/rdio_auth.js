$(document).ready(function() {

    $("#rdio_auth").click(function() {
        $.get("/user/rdio_auth_url", function(response) {
            if (typeof(response) === "string") {
                response = JSON.parse(response);
            }

            var url = response.url;
            popupwindow(url, "Rdio auth", 500, 400);
        });
    });
});
