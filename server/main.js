configure();

Meteor.startup(
  Meteor.bindEnvironment(function() {
    Meteor.defer(function() {
      Benchmark.time(configureDEBUG, "[Startup] configure");
      Benchmark.time(ensureIndexes, "[Startup] ensureIndexes");
      Benchmark.time(observeFirebase, "[Startup] observeFirebase");
      Benchmark.time(observeCollections, "[Startup] observeCollections");
      Benchmark.time(Scheduler.startup, "[Startup] startScheduler");
    });
  })
);

var observeFirebase = function() {
  var firebaseRef = new Firebase(Meteor.settings.firebase.config);
  firebaseRef.auth(Meteor.settings.firebase.configSecret, Meteor.bindEnvironment(function(error, result) {
    if (error) {
      console.error('Login Failed!', error);
    } else {
      console.info('Authenticated successfully with payload:', result.auth);
      console.info('Auth expires at:', new Date(result.expires * 1000));
      observeCompaniesFromFirebaseDEBUG();
      observeBeaconEventsFromFirebase();
      observeEngagementEventsFromFirebase();
    }
  }));
};

var observeCollections = function() {
  var classes = [
    Encounter, Engagement, SegmentVisitor,
    EngagementMetric, InstallationMetric, ProductMetric, VisitorMetric
  ];
  classes.forEach(function(objectClass) {
    if (objectClass.hasOwnProperty('startup')) {
      objectClass.startup();
    }
  });
};
