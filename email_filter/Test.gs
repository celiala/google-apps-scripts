// List-ID:[^<]*<(.+?)>
function regexTest() {
  var matches = (/\[foo\]/i).exec("foodie");
  Logger.log(matches);  
}
