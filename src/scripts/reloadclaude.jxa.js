function run() {
    // Get a reference to System Events
    var systemEvents = Application("System Events");
    // Launch the target app
    Application("Claude").quit();
    
    delay(2);
    
    Application("Claude").activate();

    // Get the target process (replace "TargetAppName" with the actual app name)
    var targetApp = systemEvents.processes["Claude"];

    //Spin until application is active, but not longer than 2 seconds
    var start = new Date().getTime();
    while (targetApp.frontmost() === false) {
        delay(0.1);
        if (new Date().getTime() - start > 2000) {
            console.log("Application not active after 2 seconds, aborting");
            return;
        }
    }
}