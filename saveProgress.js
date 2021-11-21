const LEARNGERMAN_DW_URL = "https://learngerman.dw.com";
const COURSE_IDS = {
  36519789: "A1",
  36519797: "A2",
  36519718: "B1",
};

function initTotals(learnProgress) {
  let totals = {};
  for (let [courseId, courseName] of Object.entries(COURSE_IDS)) {
    const course = learnProgress.courses.find((course) => course.cosCourseId == courseId);
    if (!course) {
      alert(`Failed to find ${courseName} in course list from ${LEARNGERMAN_DW_URL}`);
      return;
    }
    const { allExerciseCount } = course;
    console.log(`Total for ${courseName}: ${allExerciseCount}`);

    totals[courseName] = allExerciseCount;
  }
  return totals;
}

function run() {
  // clear localstorage:
  chrome.storage.local.set({ progress: null, totals: null }, (_) => {});

  if (!document.URL.startsWith(LEARNGERMAN_DW_URL)) {
    alert(`You are not at ${LEARNGERMAN_DW_URL}. Not updating progress.`);
    return;
  }

  const { learnProgress, user } = JSON.parse(window.localStorage.getItem("learngerman"));
  if (!learnProgress) {
    alert("Missing learngerman.learnProgress in DW's local storage");
    return;
  }

  if (!user.isLoggedIn || !user.userData.email) {
    alsert("User not logged in. Not saving progress");
    return;
  }
  let email = user.userData.email;

  chrome.storage.local.get(["progress", "totals"], function (result) {
    console.log(`chrome.storage:`);
    console.log(result);
    let { progress, totals } = result;

    console.log("Progress currently is " + progress);
    if (!progress) {
      progress = {};
    }
    if (!(email in progress)) {
      progress[email] = {
        A1: [],
        A2: [],
        B1: [],
      };
    }

    totals = initTotals(learnProgress);

    const now = new Date();
    console.log(`now: ${now}`);
    const timestamp = now.getTime();

    for (let [courseId, courseName] of Object.entries(COURSE_IDS)) {
      const course = learnProgress.courses.find((course) => course.cosCourseId == courseId);
      if (!course) {
        alert(`Failed to find ${courseName} in course list from ${LEARNGERMAN_DW_URL}`);
        return;
      }
      const { doneExerciseCount } = course;
      console.log(`Done for ${courseName}: ${doneExerciseCount} `);

      if (doneExerciseCount > 0) {
        let previousDoneExerciseCount = 0;
        if (progress[email][courseName].length > 0) {
          previousDoneExerciseCount = progress[courseName].at(-1);
        }
        if (doneExerciseCount > previousDoneExerciseCount) {
          progress[email][courseName].push({
            timestamp,
            doneExerciseCount,
          });
        }
      }
    }

    chrome.storage.local.set({ totals, progress }, function () {
      console.log("Progress & totals saved");
    });
  });
}

run();
