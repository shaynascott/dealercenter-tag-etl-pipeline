function importDealerCenterTags() {
  const ROUTES = [
    { label: "DealerCenter-PA-Passenger", sheetName: "PA Passenger" },
    { label: "DealerCenter-PA-Trucks",    sheetName: "PA Trucks" },
    { label: "DealerCenter-OutOfState",   sheetName: "Out of State" }
  ];

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Helper to format "Street, City, State Zip" cleanly (returns "" if all empty)
  function formatAddress(street, city, state, zip) {
    const stateZip = [state, zip].filter(Boolean).join(" ");
    return [street, city, stateZip].filter(Boolean).join(", ");
  }

  ROUTES.forEach(route => {
    const sheet = ss.getSheetByName(route.sheetName);
    if (!sheet) return;

    // Build a set of existing "VIN|Customer Name" keys for this specific tab
    const lastRow = sheet.getLastRow();
    const existingKeys = new Set();
    if (lastRow > 1) {
      const existingData = sheet.getRange(2, 1, lastRow - 1, 9).getDisplayValues();
      existingData.forEach(row => {
        const name = String(row[2] || "").trim().toUpperCase(); // Col C: Customer Name
        const vin  = String(row[8] || "").trim().toUpperCase(); // Col I: VIN Last Six
        if (vin) existingKeys.add(vin + "|" + name);
      });
    }

    // Grab only unread emails for this route's label
    const threads = GmailApp.search('label:"' + route.label + '" is:unread');

    threads.forEach(thread => {
      const messages = thread.getMessages();

      messages.forEach(msg => {
        const attachments = msg.getAttachments();

        attachments.forEach(file => {
          if (file.getName().toLowerCase().endsWith(".csv")) {
            const csvData = Utilities.parseCsv(file.getDataAsString());
            const newRows = [];

            for (let i = 0; i < csvData.length; i++) {
              const row = csvData[i];
              if (row.length < 17) continue;

              const dealDate      = String(row[0]  || "").trim();
              const tag           = String(row[1]  || "").trim();
              const firstName     = String(row[2]  || "").trim();
              const lastName      = String(row[3]  || "").trim();
              const street        = String(row[4]  || "").trim();
              const city          = String(row[5]  || "").trim();
              const state         = String(row[6]  || "").trim();
              const zip           = String(row[7]  || "").trim();

              const coFirstName   = String(row[8]  || "").trim();
              const coLastName    = String(row[9]  || "").trim();
              const coStreet      = String(row[10] || "").trim();
              const coCity        = String(row[11] || "").trim();
              const coState       = String(row[12] || "").trim();
              const coZip         = String(row[13] || "").trim();

              const insName       = String(row[14] || "").trim();
              const insPolicy     = String(row[15] || "").trim();
              const vinLastSix    = String(row[16] || "").trim();

              // Skip header row, blank rows, or summary/total rows
              if (!vinLastSix || vinLastSix.toLowerCase() === "vin last six") continue;

              const customerName = [firstName, lastName].filter(Boolean).join(" ");
              const customerAddr = formatAddress(street, city, state, zip);
              const cosignerName = [coFirstName, coLastName].filter(Boolean).join(" ");
              const cosignerAddr = formatAddress(coStreet, coCity, coState, coZip);

              const key = vinLastSix.toUpperCase() + "|" + customerName.toUpperCase();

              if (!existingKeys.has(key)) {
                newRows.push([
                  dealDate,
                  tag,
                  customerName,
                  customerAddr,
                  cosignerName,
                  cosignerAddr,
                  insName,
                  insPolicy,
                  vinLastSix
                ]);
                existingKeys.add(key);
              }
            }

            if (newRows.length > 0) {
              const startRow = sheet.getLastRow() + 1;
              const numRows = newRows.length;

              // Keep Tag (B), Policy # (H), and VIN Last Six (I) as plain text
              sheet.getRange(startRow, 2, numRows, 1).setNumberFormat("@");
              sheet.getRange(startRow, 8, numRows, 1).setNumberFormat("@");
              sheet.getRange(startRow, 9, numRows, 1).setNumberFormat("@");

              // Write only Columns A-I (leaves Column J Title Number untouched)
              sheet.getRange(startRow, 1, numRows, 9).setValues(newRows);
            }
          }
        });
      });

      // Mark processed email as read so it isn't imported again
      thread.markRead();
    });
  });
}
