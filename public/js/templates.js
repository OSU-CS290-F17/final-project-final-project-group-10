(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['404'] = template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = container.invokePartial(partials.header,depth0,{"name":"header","data":data,"helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "\n<div id = 'main-container'>\n	<div id = 'content-container' style=\"background-color: #fff;\">\n		<br /><br />\n    <center>\n      <h1>Oops! That's an error.</h1><br />\n      <h2>404 - The requested URL was not found on this server.</h2>\n    </center>\n	</div>\n</div>\n";
},"usePartial":true,"useData":true});
templates['image-container-response'] = template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = container.invokePartial(partials["image-container"],depth0,{"name":"image-container","data":data,"helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "");
},"usePartial":true,"useData":true});
templates['index'] = template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = container.invokePartial(partials.header,depth0,{"name":"header","data":data,"helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "\n<div id = 'main-container'>\n	<div id = 'content-container'>\n"
    + ((stack1 = container.invokePartial(partials.drawingApp,depth0,{"name":"drawingApp","data":data,"indent":"\t\t","helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "	</div>\n\n"
    + ((stack1 = container.invokePartial(partials.sidebar,depth0,{"name":"sidebar","data":data,"indent":"\t","helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "\n</div>\n<!-- Include JS for the paint app. -->\n<script src=\"js/paintapp.js\" defer></script>\n";
},"usePartial":true,"useData":true});
})();