const fs = require("fs");
const path = require("path");

const fileArray = fs.readdirSync(
  path.join(__dirname, "analytic_backups", "previous_days")
);

// console.log(fileArray);

fileArray.forEach((item, index) => {
  console.log(item);
  let fileToParsePath = path.join(
    __dirname,
    "analytic_backups",
    "previous_days",
    `${item}`
  );

  let previousBackupParse = JSON.parse(fs.readFileSync(fileToParsePath));

  // console.log(previousBackupParse);

  class PublicAnalyticObj {
    constructor() {
      this.date = previousBackupParse.date;
      this.uniqueVisitors = previousBackupParse.iplog.length;
      this.countries = previousBackupParse.countries;
      this.totalSessions =
        previousBackupParse.activeSessions.length +
        previousBackupParse.closedSessions.length;
    }
  }

  const analyticsToSend = new PublicAnalyticObj();

  console.log(analyticsToSend);

  try {
    fs.writeFileSync(
      path.join(
        __dirname,
        "analytic_backups",
        "public_data",
        "previous_days_public",
        `public_${item}`
      ),
      JSON.stringify(analyticsToSend)
    );
  } catch (err) {
    console.log("Err writing daily public backup, exiting");
    process.exit();
  }
  console.log("Daily public backup wrote");
});
