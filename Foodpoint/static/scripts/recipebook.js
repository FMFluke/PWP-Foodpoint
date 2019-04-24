"use strict";

const DEBUG = true;
const MASONJSON = "application/vnd.mason+json";
const PLAINJSON = "application/json";

function renderError(jqxhr) {
    let msg = jqxhr.responseJSON["@error"]["@message"];
    $("div.notification").html("<p class='error'>" + msg + "</p>");
}

function renderMsg(msg) {
    $("div.notification").html("<p class='msg'>" + msg + "</p>");
}

function getResource(href, renderer) {
    $.ajax({
        url: href,
        success: renderer,
        error: renderError
    });
}

function sendData(href, method, item, postProcessor) {
    $.ajax({
        url: href,
        type: method,
        data: JSON.stringify(item),
        contentType: PLAINJSON,
        processData: false,
        success: postProcessor,
        error: renderError
    });
}

function followLink(event, a, renderer) {
    event.preventDefault();
    getResource($(a).attr("href"), renderer);
}

function renderForm(ctrl, submitFunction) {
    //let ctrl = body["@controls"]["fpoint:add-user"]
    let form = $("<form>");
    form.attr("action", ctrl.href);
    form.attr("method", ctrl.method);
    form.submit(submitFunction);
    Object.entries(ctrl.schema.properties).forEach(
        ([name, data]) => {
            form.append("<label>" + name + " ("+ data.description + " )</label>");
            form.append("<input type='text' name='" + name + "'>");
        }
    );
    ctrl.schema.required.forEach(function (property) {
        $("input[name='" + property + "']").attr("required", true);
    });
    form.append("<input type='submit' name='submit' class='submitbutton' value='Submit'>");
    $("div.form").html(form);
}

function submitUser(event) {
    event.preventDefault();

    let data = {};
    let form = $("div.form form");
    data.name = $("input[name='name']").val();
    data.userName = $("input[name='userName']").val();
    //TODO: replace with your function
    //sendData(form.attr("action"), form.attr("method"), data, getSubmittedSensor);
}

function submitCollection(event) {
    event.preventDefault();
    let data = {};
    let form = $("div.form form");
    data.name = $("input[name='name']").val();
    data.description = $("input[name='description']").val();
    //TODO: replace with your function
    sendData(form.attr("action"), form.attr("method"), data, getSubmittedCollection);
}

function getSubmittedCollection(data, status, jqxhr) {
    renderMsg("Successful");
    let href = jqxhr.getResponseHeader("Location");
    if (href) {
        getResource(href, appendCollectionRow);
    }
}

function collectionRow(item) {
    let link = "<a href='" +
                item["@controls"].self.href +
                "' onClick='followLink(event, this, renderCollection)'>show</a>";
    return "<tr><td>" + item.name +
        "</td><td>" + link + "</td></tr>";
}

function recipeRow(item) {
    let link = "<a href='" +
                item["@controls"].self.href +
                "' onClick='followLink(event, this, renderRecipe)'>see details</a>";
    return "<tr><td>" + item.title +
        "</td><td>" + link + "</td></tr>";
}

function appendCollectionRow(body) {
    $(".resulttable tbody").append(collectionRow(body));
}

function renderCreateUser(body) {
    $("div.navigation").html(
        "<a href='http://localhost:5000/api/' onClick='followLink(event, this, renderStartPage)'>Back</a>"
    );
    $(".contenttitle").html("<h1>Create a new user</h1>");
    $(".contentdata").html("<p>Fill the form to create a new user. Your username must be unique.</p>");
    renderForm(body["@controls"]["fpoint:add-user"], submitUser);
}

function findUser(event) {
    event.preventDefault();
    let userName = $("input[name='userName']").val();
    let form = $("div.form form");
    //construct url to that user
    let url = form.attr("action")+userName+"/";
    getResource(url, renderUserPage);
}

function renderUserPage(body) {
    $("div.notification").empty();
    $("div.navigation").empty();
    $(".contenttitle").html("<h1>"+body.name+"</h1>");
    $(".contentdata").html(
        "<p>This is your user page. You can edit your information or <a href='"+
        body["@controls"]["fpoint:collections-by"].href+
        "' onClick='followLink(event, this, renderCollections)'>click to see your collections.</a></p>"
    );
    $(".resulttable thead").empty();
    $(".resulttable tbody").empty();

    //render form for editing the user's profile
    renderForm(body["@controls"]["edit"], submitUser) //<<submitUser is not implemented completely yet
    //pre-fill with current data
    $("input[name='name']").val(body.name);
    $("input[name='userName']").val(body.userName);
}

function renderCollections(body) {
    $("div.navigation").html(
        "<a href='"+ body["@controls"]["author"].href +"' onClick='followLink(event, this, renderUserPage)'>Back</a>"
    );
    //Workaround to get the name of user, maybe I should have had this field in the ColllectionsByUser resource...
    getResource(body["@controls"]["author"].href, function (body) {
        $(".contenttitle").html("<h1>"+body.name+"</h1>");
    });

    $(".contentdata").html("<p>Below is your collections:</p>");
    $(".resulttable thead").html(
        "<tr><th>Collection Name</th>><th>Actions</th></tr>"
    );
    let tbody = $(".resulttable tbody");
    tbody.empty();
    if (body.items.length > 0) {
        body.items.forEach(function (item) {
            tbody.append(collectionRow(item));
        });
    } else {
        $(".contentdata").html("<p>Looks like you haven't create any collection, create one below.</p>")
    }
    $(".contentbeforeform").html("<p>Create a new collection</p>");
    renderForm(body["@controls"]["fpoint:add-collection"], submitCollection);
}

function renderCollection(body) {
    $("div.navigation").html(
        "<a href='"+ body["@controls"]["fpoint:collections-by"].href +"' onClick='followLink(event, this, renderCollections)'>Back</a>"
    );
    $(".contenttitle").html("<h1>"+body.name+"</h1>");
    //description may be null for a collection
    if (body.description) {
        $(".contentdata").html("<p>Description: "+body.description+"</p>");
    }
    else {
        $(".contentdata").empty();
    }
    $(".resulttable thead").html(
        "<tr><th>Recipe title</th>><th>Actions</th></tr>"
    );
    let tbody = $(".resulttable tbody");
    tbody.empty();
    if (body.items.length > 0) {
        $(".contentdata").append("<p>Recipes:</p>");
        body.items.forEach(function (item) {
            tbody.append(recipeRow(item));
        });
    } else {
        $(".contentdata").append("<p>This collection has no recipes yet, add one.</p>");
    }
    //TODO: add form for editing collection and add recipe

}

function renderRecipe(body) {
    //TODO: implement
    $("div.navigation").html(
        "<a href='"+ body["@controls"]["collection"].href +"' onClick='followLink(event, this, renderCollection)'>Back</a>"
    );
    $(".contenttitle").html("<h1>"+body.title+"</h1>");
    $(".contentdata").html("<p>Description: "+body.description+"</p>");
    $(".resulttable thead").empty();
    $(".resulttable tbody").empty();
    $(".contentbeforeform").empty();

    renderForm(body["@controls"]["edit"], submitRecipe);

    //replace with textarea for long text fields
    $("input[name='description']").before("<textarea rows = '5' cols = '60' name = 'description'></textarea><br>");
    $("input[name='description']").remove();
    $("input[name='ingredients']").before("<textarea rows = '5' cols = '60' name = 'ingredients'></textarea><br>")
    $("input[name='ingredients']").remove()

    //Pre-fill value
    $("input[name='title']").val(body.title);
    $("textarea[name='description']").val(body.description);
    $("textarea[name='ingredients']").val(body.ingredients);
    $("input[name='rating']").val(body.rating);
    $("input[name='ethnicity']").val(body.ethnicity);
    $("input[name='category']").val(body.category);

}

function submitRecipe(event) {
    event.preventDefault();

    let data = {};
    let form = $("div.form form");
    data.title = $("input[name='title']").val();
    data.description = $("textarea[name='description']").val();
    data.ingredients = $("textarea[name='ingredients']").val()
    data.rating = $("input[name='rating']").val()
    data.ethnicity = $("input[name='ethnicity']").val()
    data.category = $("input[name='category']").val()

    if (!data.rating) { delete data.rating; }

    sendData(form.attr("action"), form.attr("method"), data, getSubmittedRecipe);
}

function getSubmittedRecipe(data, status, jqxhr) {
    renderMsg("Successful");
    let href = jqxhr.getResponseHeader("Location");
    if (href) {
        //POST: Append recipe row TODO: implement function appendRecipeRow
        //getResource(href, appendCollectionRow);
    } else {
        //PUT: Just update the page content
        $(".contenttitle").html("<h1>"+$("input[name='title']").val()+"</h1>");
        $(".contentdata").html("<p>Description: "+$("textarea[name='description']").val()+"</p>");
    }
}

function renderStartPage(body) {
    $("div.navigation").empty();
    $(".contenttitle").html("<h1>Welcome</h1>");
    $(".contentdata").html("<p>Enter your username, or <a href='" +
    body["@controls"]["fpoint:all-users"].href +
    "' onClick='followLink(event, this, renderCreateUser)'>create a new user.</a></p>");

    //form for login
    let form = $("<form>");
    form.attr("action", body["@controls"]["fpoint:all-users"].href);
    form.append("<label>Enter username</label>");
    form.append("<input type='text' name='userName'>");
    form.append("<input type='submit' class='submitbutton' name='submit' value='Enter'>");
    form.submit(findUser);
    $("div.form").html(form);
}

$(document).ready(function () {
    getResource("http://localhost:5000/api/", renderStartPage);
});
