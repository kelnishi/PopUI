import { exec, spawn, ChildProcess, ExecException } from 'child_process';
import { platform } from 'os';
import path from "path";
import {app} from "electron";

/**
 * Result of a command execution
 */
interface CommandResult {
  success: boolean;
  output?: string;
  error?: string;
  platform?: string;
}

/**
 * Data from a process output stream
 */
interface ProcessStreamData {
  id: string;
  data: string;
}

/**
 * Data for process completion
 */
interface ProcessCloseData {
  id: string;
  code: number | null;
}

/**
 * Executes a shell command and returns the output as a Promise
 * @param command - The command to execute
 * @returns A promise that resolves with the command output
 */
function executeCommand(command: string): Promise<string> {
  console.log("Executing command", command);
  return new Promise<string>((resolve, reject) => {
    exec(command, (error: ExecException | null, stdout: string, stderr: string) => {
      if (error) {
        console.error('Error in exec:', error);
        reject(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.warn(`Warning: ${stderr}`);
      }
      console.log('Stdout output:', stdout);
      resolve(stdout);
    });
  });
}

/**
 * Spawns a long-running process and returns the process instance
 * @param command - The command to run
 * @param args - Command arguments
 * @returns The spawned child process
 */
function spawnProcess(command: string, args: string[] = []): ChildProcess {
  const process = spawn(command, args);
  return process;
}

/**
 * Sends a message via the sendtoclaud.js AppleScript (macOS only)
 * @param message - The message to send
 * @returns A promise that resolves with the command result or null if not on macOS
 */
async function sendToClaude(message: string): Promise<CommandResult> {
  // Check if running on macOS
  if (!isMacOS()) {
    return {
      success: false,
      error: 'This feature is only available on macOS',
      platform: platform()
    };
  }
  
  try {
    // Escape the message to prevent shell injection
    const escapedMessage = message.replace(/'/g, "'\\''");
    
    // Build and execute the osascript command
    const scriptPath = path.join(app.getPath('userData'), 'scripts', 'sendtoclaude.jxa.js');
    const command = `osascript -l JavaScript "${scriptPath}" '${escapedMessage}'`;
    const output = await executeCommand(command);
    
    return {
      success: true,
      output
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Checks if the current platform is macOS
 * @returns true if on macOS, false otherwise
 */
function isMacOS(): boolean {
  return platform() === 'darwin';
}

/**
 * Get information about the current platform
 * @returns An object containing platform information
 */
function getPlatformInfo(): { platform: string; isMacOS: boolean } {
  return {
    platform: platform(),
    isMacOS: isMacOS()
  };
}

export {
  executeCommand,
  spawnProcess,
  sendToClaude,
  isMacOS,
  getPlatformInfo,
  CommandResult,
  ProcessStreamData,
  ProcessCloseData
};