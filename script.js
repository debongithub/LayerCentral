// Define the URL for the API endpoint
const apiUrl = 'https://1fckq8m6nf.execute-api.us-east-1.amazonaws.com/dev/LambdaConfigReporter';
const latestLayerFetch = 'https://1fckq8m6nf.execute-api.us-east-1.amazonaws.com/dev/latestlayerfetch';
const rotateLayer = 'https://1fckq8m6nf.execute-api.us-east-1.amazonaws.com/dev/rotatelayers';

// Get a reference to the form and the input element
const form = document.querySelector('form');
const input = document.getElementById('layer-arn-input');
const latest_layer_label = document.getElementById('latest-layer');
const rotateButton = document.getElementById("rotate-button");


rotateButton.addEventListener("click", function(event) {
    event.preventDefault(); // prevent the default form submission behavior
    const layerArn = input.value;
    // make a fetch call to your API endpoint
    fetch(rotateLayer, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action_type: "rotate",
        layerArn: latest_layer_label.textContent
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
        alert(`Rotate Layers Response: ${data}`);
    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error);
    });
  });
  
// Add an event listener to the form's submit button
form.addEventListener('submit', function (event) {
    // Prevent the default form submission behavior
    const layerArn = input.value;
    event.preventDefault();
    // Get the layer ARN from the input element
    // Make a POST request to the API endpoint with the layer ARN in the body
    fetch(latestLayerFetch, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action_type: "search",
            layerArn: layerArn
        })
    })
    .then(response => response.json())
    .then(data => {
        latest_layer_label.textContent =  data.LatestArn;
    });

    // Make a POST request to the API endpoint with the layer ARN in the body
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action_type: "search",
            layerArn: layerArn
        })
    })
        .then(response => response.json())
        .then(data => {
            // Get a reference to the table element
            const table = document.getElementById('my-table');

            // Define the table columns and their headers
            const tableColumns = [
                { title: 'Account Number', field: 'AccountNumber', sorter: "string", headerSort: false },
                { title: 'Function Name', field: 'FunctionName', sorter: "string", headerSort: false },
                { title: 'Version', field: 'Version', sorter: "string", headerSort: false },
                { title: 'ARN', field: 'Arn', sorter: "string", headerSort: false }
            ];

            // Initialize the Tabulator table with the columns and options
            const tabulatorTable = new Tabulator(table, {
                rowFormatter: function (row) {
                    if (row.getData().col == "blue") {
                        row.getElement().style.backgroundColor = "#1e3b20";
                    }
                },
                pagination: 'local',
                paginationSize: 20,
                layout: 'fitColumns',
                columns: tableColumns
            });

            tabulatorTable.on("tableBuilt", function () {
                tabulatorTable.setData(data);

                // Set the table to the first page
                tabulatorTable.setPage(1);
            });

            //Export to CSV :

            document.getElementById("export-btn").addEventListener("click", function () {
                // trigger the CSV download
                tabulatorTable.download("csv", "table-data.csv");
            });

        })
        .catch(error => console.error(error));
});
