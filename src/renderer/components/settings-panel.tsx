import * as Separator from "@radix-ui/react-separator"
import { FileList } from "./file-list"
import React from "react"

export function SettingsPanel() {
  //   checkbox state for auto send
    const [autoSend, setAutoSend] = React.useState(true)
    
    React.useEffect(() => {
        window.api.getPreference('autoSend').then((value) => {
            setAutoSend(value === 'true');
        }).catch((err) => {
            console.error("Error fetching autoSend preference:", err)
        });
    }, [])
    
  return (
    <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500">Manage your app settings and files</p>
          
          <Separator.Root className="my-4 h-px bg-gray-200 w-full" />
      {/*  Auto Send toggle  */}
          <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Auto Send</label>
              <input 
                  checked={autoSend}
                  onChange={(e) => {
                      setAutoSend(e.target.checked);
                      window.api.setPreference('autoSend', e.target.checked?"true":"false");
                  }}
                  type="checkbox" 
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
              />
              <p className="text-sm text-gray-500">Automatically send UI generated chat messages when clicking buttons.</p>
          </div>
          <Separator.Root className="my-4 h-px bg-gray-200 w-full" />
          <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Interface Files</h3>
              <FileList />
          </div>
      </div>

    </div>
  )
}

