import net from "node:net";

const proxyServer = net.createServer();

const needle = "i like big trains and i cant lie";

proxyServer.on("connection", (conn) => {
  // connect to another tcp server running on port 3032
  const connectToServer = () => {
    const connectionToMainServer = net.createConnection(
      3032,
      "localhost",
      () => {
        console.log("Connected to server");
      }
    );
    return connectionToMainServer;
  };
  const connectionToMainServer = connectToServer();

  // read data from server
  const readFromServer = (connectionToMainServer) => {
    connectionToMainServer.write("a");
    var buffer = "";
    var startIndex = 0;
    var endIndex = 0;
    connectionToMainServer.on("data", (data) => {
     
      buffer += data.toString("utf-8");

     
      // find the exact match of the needle from startIndex to buffer.length and replace it with "- ---- --- ------ --- - ---- ---"
      var searchArea = buffer.substring(startIndex, buffer.length);
      var indices = getIndicesOf(needle, searchArea);
      
      if (indices.length > 0) {
        for (var i = 0; i < indices.length; i++) {
          var index = indices[i];
          var replaceLength = needle.length;

          while (replaceLength > 0) {
            if (searchArea[index] === "\n") {
              
              index++;
              continue;
            } else if (searchArea[index] !== " ") {
              searchArea =
                searchArea.substring(0, index) +
                "-" +
                searchArea.substring(index + 1);
            }
            replaceLength--;
            index++;
          }
        }
      }

      

      endIndex = buffer.length;
      buffer =
        buffer.substring(0, startIndex) +
        searchArea +
        buffer.substring(endIndex, buffer.length);

      // 1. Find if there is any partial match in the end of the buffer
      var lastPossibleSubstring = buffer.substring(
        buffer.length - needle.length - 1,
        buffer.length
      );
      for (var i = 0; i < lastPossibleSubstring.length; i++) {
        if (lastPossibleSubstring[i] === needle[0]) {
          var possiblePartialmatch = lastPossibleSubstring.substring(
            i,
            lastPossibleSubstring.length - 1
          );
          if (needle.includes(possiblePartialmatch)) {
            endIndex = buffer.length - possiblePartialmatch.length - 1;
            
            break;
          }
        }
      }
      
      // endIndex = buffer.length;
      var dataToWrite = buffer.substring(startIndex, endIndex);
      // remove line break from the last line
      // dataToWrite = dataToWrite.replace(/\n$/, "");
      startIndex = endIndex;

      conn.write(dataToWrite);
    });
  };

  conn.on("close", () => {
    console.log("Connection closed");
    connectionToMainServer.destroy();
  });

  conn.on("error", (error) => {
    console.error(error);
  });
  readFromServer(connectionToMainServer);
});

function getIndicesOf(searchStr, str) {
  var lineBreaks = [];
  // find all the line breaks in the  string
  
  while (str.indexOf("\n") > -1) {
    var index = str.indexOf("\n");
    lineBreaks.push(index);
    // take the word before the line break
    var word = str.substring(0, index);
    word = word.split(" ")[word.split(" ").length - 1];
    const needlesArray = needle.split(" ");
    var found = false;
    if (needlesArray.includes(word)) {
      found = true;
    }
    
    if (found) {
      str = str.substring(0, index) + " " + str.substring(index + 1);
    } else {
      str = str.substring(0, index) + str.substring(index + 1);
    }
  }
 

  var searchStrLen = str.length;
  if (searchStrLen == 0) {
    return [];
  }
  var startIndex = 0,
    index,
    indices = [];

  str = str.toLowerCase();
  searchStr = searchStr.toLowerCase();

  while ((index = str.indexOf(searchStr, startIndex)) > -1) {
    indices.push(index);
    startIndex = index + 1;
  }

  // add the line breaks back to the indices
  for (var i = 0; i < indices.length; i++) {
    var index = indices[i];
    for (var j = 0; j < lineBreaks.length; j++) {
      if (index > lineBreaks[j]) {
        index++;
      }
    }
    indices[i] = index;
  }

  return indices;
}

const port = parseInt(process.env.PORT ?? "3031");

proxyServer.listen(port, () => {
  console.log(`STARTED SERVER 0.0.0.0:${port}`);
});
