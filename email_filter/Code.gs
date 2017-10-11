// Original script: https://github.com/paoloantinori/gmail-labeler

var filters = [
  { name: "accepted", match: /This revision is now accepted/i },
  { name: "committed", subject: /\[Diffusion\] \[Committed\]/i },
  { name: "reviewer", match: /EMAIL PREFERENCES(\s|.)*To.*celia/i },
  { name: "subscriber", match: /EMAIL PREFERENCES(\s|.)*Cc.*celia/i },
];

var limit_to = [
  "label:purge+phabricator",
];

var from = [
  "to:celia+phabricator@my-email.com",  // TODO: replace with email
];

var ROOT_FOLDER = "phab/";
var SELECTION = "";

function labeler() {

  var batchSize = 50;
  var labelCache = {};
  var query = "(" + limit_to.join(' OR ') + ") AND (" + from.join(' OR ') + ")";
  
  if (SELECTION) {
    query += " AND (" + SELECTION + ")";
  }
  Logger.log(query);
  var threads = GmailApp.search(query, 0, batchSize);
  GmailApp.getMessagesForThreads(threads);

  var findOrCreateLabel = function(name) {
    if (labelCache[name] === undefined) {
      var labelObject = GmailApp.getUserLabelByName(name);
      if( labelObject ){
        labelCache[name] = labelObject;
      } else {
        labelCache[name] = GmailApp.createLabel(name);
        Logger.log("Created new label: [" + name + "]");
      }
      
    }
    return labelCache[name];
  }

  var applyLabel = function(name, thread){
    name = ROOT_FOLDER + name;
    Logger.log("applyLabel " + name);
    
    var label = null;
    var labelName = "";

    // create nested labels by parsing "/"
    name.split('/').forEach(function(labelPart, i) {
      labelName = labelName + (i===0 ? "" : "/") + labelPart.trim();
      label = findOrCreateLabel(labelName);
    });

    thread.addLabel(label);
  }

  threads.forEach(function(thread) {
    var messages = thread.getMessages();
    if (messages == null) 
      return; // nothing to do

    var runFilters = function(message) {
      var raw = message.getRawContent();
      var body = message.getPlainBody();
      
      filters.forEach(function(filter){
        // shortcuts
        if (filter.subject) 
          filter.match = new RegExp('Subject:.*?' + filter.subject, 'i');
        
        var rawMatches = filter.match.exec(raw);
        var bodyMatches = filter.match.exec(body);
        Logger.log(body);
        
        if (rawMatches !== null || bodyMatches !== null) {
          
          // label will be regex match or name provided
          var label = filter.name || matches[1];
          if (label !== undefined) 
            applyLabel(label, thread);

          Logger.log("Matches: " + label);
          
          // toggle flags
          if (filter.star) 
            message.star();
          if (filter.markRead) 
            message.markRead();
        }
      });
      
    };
    
    messages.forEach(runFilters);
    
//    var message = messages[messages.length - 1]; // most recent message
//    runFilters(message);
    

  });
}