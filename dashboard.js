function plotlyIdForEmail(email) {
  return email.replace("@", "").replace(".", "") + "-plotly";
}

function createReport(email, progress, totals) {
  console.log(email, progress);
  const progressListItems = Object.keys(progress)
    .map((level) => {
      return { level, progress: progress[level].length > 0 ? progress[level].at(-1).doneExerciseCount : 0 };
    })
    .sort((first, second) => {
      return first.level < second.level;
    })
    .map((item) => {
      const percent = ((100 * item.progress) / totals[item.level]).toFixed(1);
      return `<li>${item.level}: ${item.progress} / ${totals[item.level]} (${percent}%)</li>`;
    })
    .join("");

  const emailId = plotlyIdForEmail(email);

  return `
    <section>
      <h3>Report for ${email}</h3>
      <p>Current progress:</p>
      <ul>
        ${progressListItems}
      </ul>
      <div id="${emailId}"></div>
    </section>
  `;
}

function linearRegressionMatchFirstPoint(originalData) {
  let m;

  // Store data length in a local variable to reduce
  // repeated object property lookups
  const dataLength = originalData.length;

  // Offset data to pass through origin
  const data = originalData.map((e) => {
    return [e[0] - originalData[0][0], e[1] - originalData[0][1]];
  });

  //if there's only one point, arbitrarily choose a slope of 0
  //and a y-intercept of whatever the y of the initial point is
  if (dataLength === 1) {
    m = 0;
  } else {
    // Initialize our sums and scope the `m` and `b`
    // variables that define the line.
    let sumXX = 0;
    let sumXY = 0;

    // Use local variables to grab point values
    // with minimal object property lookups
    let point, x, y;

    for (let i = 0; i < dataLength; i++) {
      point = data[i];
      x = point[0];
      y = point[1];

      sumXX += x * x;
      sumXY += x * y;
    }

    // `m` is the slope of the regression line
    m = sumXY / sumXX;
  }

  return function (x) {
    return originalData[0][1] + m * (x - originalData[0][0]);
  };
}

function getLinearRegression(x, y) {
  const pairs = x.map(function (e, i) {
    return [e, y[i]];
  });
  const l = linearRegressionMatchFirstPoint(pairs);
  return x.map((e) => l(e));
}

function plotProgress(email, progress, totals) {
  TESTER = document.getElementById(plotlyIdForEmail(email));

  const { x, y } = mockDataPoints();
  console.log(x, y);
  // const x = [1, 2, 3, 4, 5];
  // const y = [1, 2, 4, 8, 16];

  const yLinearRegression = getLinearRegression(x, y);
  console.log(yLinearRegression);

  const xDates = x.map((e) => new Date(e).toISOString());
  console.log(xDates);

  const goalDate = new Date(document.getElementById("goal").value);

  const maxDate = goalDate > xDates.at(-1) ? goalDate : xDates.at(-1);

  Plotly.newPlot(
    TESTER,
    [
      // Actual progress
      {
        x: xDates,
        y,
        name: "Progress",
      },
      // Predicted progress
      {
        x: xDates,
        y: yLinearRegression,
        name: "Prediction",
        line: {
          dash: "dot",
        },
        mode: "lines",
      },
      // Progress neeed to achieve goal
      {
        x: [xDates[0], goalDate],
        y: [y[0], 1074 + 864 + 670],
        name: "Goal",
        line: {
          dash: "solid",
          width: 1,
        },
        mode: "lines",
      },
      // Horizontal A1 line
      {
        x: [xDates[0], maxDate],
        y: [1074, 1074],
        fill: "tozeroy",
        fillcolor: "rgba(0, 0, 255, 0.1)",
        line: {
          color: "rgb(0, 0, 255)",
        },
        name: "A1",
        text: "A1",
        textposition: "bottom right",
        type: "scatter",
        mode: "lines+text",
      },
      // Horizontal A2 line
      {
        x: [xDates[0], maxDate],
        y: [1074 + 864, 1074 + 864],
        fill: "tonexty",
        fillcolor: "rgba(200, 0, 0, 0.1)",
        line: {
          color: "rgb(200, 0, 0)",
        },
        name: "A2",
        text: "A2",
        textposition: "bottom right",
        type: "scatter",
        mode: "lines+text",
      },
      // Horizontal B1 line
      {
        x: [xDates[0], maxDate],
        y: [1074 + 864 + 670, 1074 + 864 + 670],
        fill: "tonexty",
        fillcolor: "rgba(0, 200, 0, 0.1)",
        line: {
          color: "rgb(0, 200, 0)",
        },
        name: "B1",
        text: "B1",
        textposition: "bottom right",
        type: "scatter",
        mode: "lines+text",
      },
    ],
    {
      margin: { t: 0 },
      xaxis: {
        title: {
          text: "Time",
        },
      },
      yaxis: {
        title: {
          text: "Exercises",
        },
      },
    },
    { responsive: true }
  );
}

function mockDataPoints() {
  let x = [];
  let y = [];
  let progress = 10;
  let ts = new Date().getTime();
  while (progress < 1074 + 864 + 670) {
    progress += Math.floor(Math.random() * 20);
    ts += (18 + Math.floor(Math.random() * 6)) * 3600 * 1000;
    x.push(ts);
    y.push(progress);
  }
  return { x, y };
}

chrome.storage.local.get(["totals", "progress"], (result) => {
  const { totals, progress: progresses } = result;
  const reports = Object.entries(progresses)
    .map((item) => createReport(item[0], item[1], totals))
    .join("");

  document.getElementById("reports").innerHTML = reports;

  Object.entries(progresses).forEach((item) => {
    plotProgress(item[0], item[1], totals);
  });
});

function setMinDateToday() {
  const today = new Date();
  let dd = today.getDate();
  let mm = today.getMonth() + 1; // January is 0!
  const yyyy = today.getFullYear();

  if (dd < 10) {
    dd = "0" + dd;
  }

  if (mm < 10) {
    mm = "0" + mm;
  }

  const todayStr = yyyy + "-" + mm + "-" + dd;
  document.getElementById("goal").setAttribute("min", todayStr);
}

setMinDateToday();

function replotGraphs() {
  chrome.storage.local.get(["totals", "progress"], (result) => {
    const { totals, progress: progresses } = result;

    Object.entries(progresses).forEach((item) => {
      plotProgress(item[0], item[1], totals);
    });
  });
}

document.getElementById("goal").addEventListener("change", replotGraphs);
