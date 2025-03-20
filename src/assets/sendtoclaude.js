function run(argv) {
	// Get a reference to System Events
	var systemEvents = Application("System Events");

	// Get the target process (replace "TargetAppName" with the actual app name)
	var targetApp = systemEvents.processes["Claude"];

	// Bring the target app to the front
	targetApp.frontmost = true;

	// Wait for a moment to ensure the app is active
	delay(0.25);

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