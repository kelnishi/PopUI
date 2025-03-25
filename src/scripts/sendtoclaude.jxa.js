function run(argv) {
	// Get a reference to System Events
	var systemEvents = Application("System Events");

	Application("Claude").activate();
	
	// Get the target process (replace "TargetAppName" with the actual app name)
	var targetApp = systemEvents.processes["Claude"];

	// Bring the target app to the front
	// targetApp.frontmost = true;
	
	//Spin until application is active, but not longer than 2 seconds
	var start = new Date().getTime();
	while (targetApp.frontmost() === false) {
		delay(0.1);
		if (new Date().getTime() - start > 2000) {
			console.log("Application not active after 2 seconds, aborting");
			return;
		}
	}

	// Set the value of the first text field in the first window
	// (note: index 0 is the first element)
	var textToSend = argv[0];

	// Try to find the button for sending messages with better error handling
	var mainWindow = targetApp.windows[0];
	var uiElems = mainWindow.entireContents().reverse();
	var sendButton = uiElems.find(function(el) {
		try {
			return el.role() == 'AXButton' && el.description().toLowerCase().includes('send');
		} catch (e) {}
	})

	systemEvents.keystroke(textToSend);

	if (sendButton) {
		console.log(`Clicking send button: ${sendButton.description()}`);
		sendButton.click();
	} else {
		console.log("Button not found, sending with Return key instead");
		systemEvents.keyCode(36);
	}

}