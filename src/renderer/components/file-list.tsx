import * as React from "react"
import { View, BrainCircuit, Trash, ChevronDown, ChevronRight } from "lucide-react"
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import * as Collapsible from "@radix-ui/react-collapsible"

type File = {
  id: string
  name: string
  size: string
  metadata: Record<string, any> // JSON metadata
}

const mockFiles: File[] = [
  {
    id: "1",
    name: "document.pdf",
    size: "2.5 MB",
    metadata: {
      createdAt: "2023-04-15T10:30:00Z",
      author: "John Doe",
      pages: 42,
      keywords: ["report", "quarterly", "finance"],
    },
  },
  {
    id: "2",
    name: "image.jpg",
    size: "1.8 MB",
    metadata: {
      createdAt: "2023-05-20T14:15:00Z",
      dimensions: "1920x1080",
      camera: "Canon EOS R5",
      location: { lat: 40.7128, lng: -74.006 },
    },
  },
  {
    id: "3",
    name: "spreadsheet.xlsx",
    size: "3.2 MB",
    metadata: {
      createdAt: "2023-06-10T09:45:00Z",
      sheets: ["Q1", "Q2", "Summary"],
      lastModifiedBy: "Jane Smith",
      cells: 1024,
    },
  },
]

export function FileList() {
  const [files, setFiles] = React.useState<File[]>(mockFiles)
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>({})

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleShow = (file: File) => {
    // Implement file preview logic here
    console.log("Showing file:", file.name)
  }

  const handleOpen = (file: File) => {
    // Implement file opening logic here
    console.log("Opening file:", file.name)
  }

  const handleDelete = (fileId: string) => {
    setFiles(files.filter((file) => file.id !== fileId))
    // Also clean up the openItems state
    setOpenItems((prev) => {
      const newState = { ...prev }
      delete newState[fileId]
      return newState
    })
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {files.map((file) => (
            <React.Fragment key={file.id}>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Collapsible.Root
                    open={openItems[file.id] || false}
                    onOpenChange={() => toggleItem(file.id)}
                    className="flex items-center"
                  >
                    <Collapsible.Trigger asChild>
                      <button className="flex items-center focus:outline-none mr-2">
                        {openItems[file.id] ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </Collapsible.Trigger>
                    {file.name}
                  </Collapsible.Root>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.size}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleShow(file)}
                      className="p-1 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <View className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpen(file)}
                      className="p-1 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <BrainCircuit className="h-4 w-4" />
                      
                    </button>
                    <DeleteFileDialog file={file} onDelete={() => handleDelete(file.id)} />
                  </div>
                </td>
              </tr>
              {openItems[file.id] && (
                <tr className="bg-gray-50">
                  <td colSpan={3} className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <pre className="bg-gray-100 p-3 rounded-md overflow-auto max-h-60">
                        {JSON.stringify(file.metadata, null, 2)}
                      </pre>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type DeleteFileDialogProps = {
  file: File
  onDelete: () => void
}

function DeleteFileDialog({ file, onDelete }: DeleteFileDialogProps) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <button className="p-1 rounded-md text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500">
          <Trash className="h-4 w-4" />
        </button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-fadeIn" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 shadow-xl max-w-md w-full data-[state=open]:animate-contentShow">
          <AlertDialog.Title className="text-lg font-medium text-gray-900">
            Are you sure you want to delete this file?
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-gray-500">
            This action cannot be undone. This will permanently delete <span className="font-medium">{file.name}</span>.
          </AlertDialog.Description>
          <div className="mt-6 flex justify-end space-x-4">
            <AlertDialog.Cancel asChild>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500">
                Cancel
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={onDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Delete
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

