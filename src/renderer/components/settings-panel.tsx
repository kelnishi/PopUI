import * as Separator from "@radix-ui/react-separator"
import { FileList } from "./file-list"
import React from "react"

export function SettingsPanel() {
  return (
    <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500">Manage your app settings and files</p>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Interface Files</h3>
            <FileList />
          </div>
        </div>
      </div>
    </div>
  )
}

