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
    connectionToMainServer.write("a"); //by default writing a
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

          //replace the needle with - in the searchArea ignoring the line breaks
          while (replaceLength > 0) {
            if (searchArea[index] === "\n") {
              index++;
              continue;
            } else if (searchArea[index] !== " ") {
              //replace only letters with "-"
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

      // replace the buffer with the modified searchArea
      endIndex = buffer.length;
      buffer =
        buffer.substring(0, startIndex) +
        searchArea +
        buffer.substring(endIndex, buffer.length);

      //  Find if there is any partial match in the end of the buffer
      var lastPossibleSubstring = buffer.substring(
        buffer.length - needle.length - 1,
        buffer.length
      );
      for (var i = 0; i < lastPossibleSubstring.length; i++) {
        if (lastPossibleSubstring[i] === needle[0]) {
          //if there is a match in the first letter then search for the whole string and set the start index before matched string if found
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

      var dataToWrite = buffer.substring(startIndex, endIndex);
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

// returns all the indices of the needle
function getIndicesOf(searchStr, str) {
  var lineBreaks = [];

  // remove the line breaks but keep them saved so that they can be added back later
  while (str.indexOf("\n") > -1) {
    var index = str.indexOf("\n");
    lineBreaks.push(index);
    // take the word before the line break and match it with the words in the needle.
    // if found then we have to put a space after the word. otherwise it would look like "i likebig trains ....."
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

  var strLength = str.length;
  if (strLength == 0) {
    return [];
  }
  var startIndex = 0,
    index,
    indices = [];

  str = str.toLowerCase();
  searchStr = searchStr.toLowerCase();

  // find all the possible matches of the needle in the string
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
