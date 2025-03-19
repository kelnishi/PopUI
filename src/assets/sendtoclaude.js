
function run(argv) {
 	// Get a reference to System Events
	var systemEvents = Application("System Events");
	
	// Get the target process (replace "TargetAppName" with the actual app name)
	var targetApp = systemEvents.processes["Claude"];
	
	// Bring the target app to the front
	targetApp.frontmost = true;
	
	// Wait for a moment to ensure the app is active
	delay(1);
	
	// Set the value of the first text field in the first window
	// (note: index 0 is the first element)
	var textToSend = argv[0];
	systemEvents.keystroke(textToSend);
	
	// Send the Tab key
// 	systemEvents.keyCode(48);
	
	// Send the Return key using its key code (36)
	systemEvents.keyCode(36);
}