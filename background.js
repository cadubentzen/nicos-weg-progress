async function saveProgress() {
  // clear localstorage:
  // chrome.storage.sync.set({ progress: null, totals: null }, (_) => { });

  const LEARNGERMAN_DW_URL = "https://learngerman.dw.com";
  if (!document.URL.startsWith(LEARNGERMAN_DW_URL)) {
    alert(`Not at ${LEARNGERMAN_DW_URL}`);
    return;
  }

  const learnProgress = JSON.parse(window.localStorage.getItem('learngerman')).learnProgress;

  const courseIds = {
    36519789: "A1",
    36519797: "A2",
    36519718: "B1",
  };

  console.log(typeof learnProgress);
  console.log(learnProgress);

  let progressLog = chrome.storage.sync.get(['progress', 'totals'], function (result) {
    console.log(`chrome.storage:`);
    console.log(result);
    let { progress, totals } = result;

    console.log('Progress currently is ' + progress);
    if (!progress) {
      progress = {
        "A1": [],
        "A2": [],
        "A3": [],
      }
    }

    if (!totals) {
      // fill in totals
      totals = {}
      for (let [courseId, courseName] of Object.entries(courseIds)) {
        const course = learnProgress.courses.find(course => course.cosCourseId == courseId);
        if (!course) {
          alert(`Failed to find ${courseName} in course list from ${LEARNGERMAN_DW_URL}`);
          return;
        }
        const { allExerciseCount } = course;
        console.log(`Total for ${courseName}: ${allExerciseCount}`);

        totals[courseName] = allExerciseCount;
      }

      chrome.storage.sync.set({ totals }, function () {
        console.log('Totals saved');
      });
    }

    const now = new Date();
    console.log(`now: ${now}`);

    for (let [courseId, courseName] of Object.entries(courseIds)) {
      const course = learnProgress.courses.find(course => course.cosCourseId == courseId);
      if (!course) {
        alert(`Failed to find ${courseName} in course list from ${LEARNGERMAN_DW_URL}`);
        return;
      }
      const { doneExerciseCount } = course;
      console.log(`Done for ${courseName}: ${doneExerciseCount} `);

      if (doneExerciseCount > 0) {
        let previousDoneExerciseCount = 0;
        if (progress[courseName].length > 0) {
          previousDoneExerciseCount = progress[courseName].at(-1);
        }
        if (doneExerciseCount > previousDoneExerciseCount) {
          progress[courseName].push({ at: now.toISOString(), progress: doneExerciseCount });
          alert(
            `Progress on ${courseName}: +${doneExerciseCount - previousDoneExerciseCount} exercises.`
            + `Total of ${doneExerciseCount} /${totals[courseName]}.`
          )
        }
      }
    }

    chrome.storage.sync.set({ progress }, function () {
      console.log('Progress saved');
    });
  });
}

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: saveProgress
  }, async () => {
    let url = chrome.runtime.getURL("dashboard.html");
    let tab = await chrome.tabs.create({ url });
    console.log(`Created tab ${tab.id}`);
  });
});
