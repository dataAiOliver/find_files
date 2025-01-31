import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { Box, CssBaseline } from '@mui/material';
import theme from './theme';
import ConfigPanel from './components/ConfigPanel';
import FileViewer from './components/FileViewer';
import DetailPanel from './components/DetailPanel';
import RightPanel from './components/RightPanel';
import { Resizable } from 're-resizable';

function App() {
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [activeFilters, setActiveFilters] = useState({});
  const [visualizationType, setVisualizationType] = useState('normal');
  const [currentFiles, setCurrentFiles] = useState([]);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    const isCurrentlySelected = selectedFiles.some(f => f.id === file.id);
    
    if (isCurrentlySelected) {
      setSelectedFiles(selectedFiles.filter(f => f.id !== file.id));
    } else {
      setSelectedFiles([...selectedFiles, file]);
      if (!rightPanelOpen) {
        setRightPanelOpen(true);
      }
    }
  };

  const handleFilesSelect = (files) => {
    // For single file selection
    if (!Array.isArray(files)) {
      handleFileSelect(files);
      return;
    }

    // For multiple files selection
    const newSelectedFiles = [...selectedFiles];
    let anyNewFiles = false;

    files.forEach(file => {
      if (!selectedFiles.some(f => f.id === file.id)) {
        console.log('Adding file:', file); // Debug log
        newSelectedFiles.push(file);
        anyNewFiles = true;
      }
    });

    if (anyNewFiles) {
      setSelectedFiles(newSelectedFiles);
      if (!rightPanelOpen) {
        setRightPanelOpen(true);
      }
    }
  };

  const handleRemoveFile = (fileId) => {
    // Handle both single fileId and array of fileIds
    if (Array.isArray(fileId)) {
      setSelectedFiles(selectedFiles.filter(file => !fileId.includes(file.id)));
    } else {
      setSelectedFiles(selectedFiles.filter(file => file.id !== fileId));
    }
  };

  const handleOpenChat = () => {
    // Store selected files in localStorage for cross-tab access
    const filesToStore = selectedFiles.reduce((acc, file) => {
      acc[file.id] = {
        _id: file.id,
        filepath: file.fullPath,
        metadata: file.metadata,
        src: file.src,
        filepath_custom: file.filepath_custom || []
      };
      return acc;
    }, {});
    
    console.log('Storing files:', filesToStore);  // Debug log
    localStorage.setItem('selectedFiles', JSON.stringify(filesToStore));
    window.open('/chat', '_blank', 'noopener,noreferrer');
  };

  const handleVisualizationChange = (type, newFiles) => {
    setVisualizationType(type);
    if (newFiles) {
      setCurrentFiles(newFiles);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        display: 'flex', 
        height: '100vh',
        overflow: 'hidden'
      }}>
        {/* Linke Konfigurationsleiste */}
        <Resizable
          defaultSize={{ width: '30%', height: '100%' }}
          minWidth="250px"
          maxWidth="50%"
          enable={{
            top: false,
            right: true,
            bottom: false,
            left: false,
            topRight: false,
            bottomRight: false,
            bottomLeft: false,
            topLeft: false,
          }}
          handleStyles={{
            right: {
              width: '8px',
              right: '-4px',
              cursor: 'col-resize'
            }
          }}
        >
          <Box sx={{ width: '100%', height: '100%' }}>
            <ConfigPanel 
              onFilterChange={setActiveFilters}
              onVisualizationChange={handleVisualizationChange}
              files={currentFiles}
            />
          </Box>
        </Resizable>

        {/* Mittlerer Bereich */}
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <FileViewer 
            filter={activeFilters}
            visualization={visualizationType}
            onFileSelect={handleFilesSelect}
            selectedFiles={selectedFiles}
            onFilesChange={setCurrentFiles}
            files={currentFiles}
          />
          <DetailPanel selectedFile={selectedFile} />
        </Box>

        {/* Rechter Bereich */}
        <RightPanel 
          open={rightPanelOpen}
          onToggle={() => setRightPanelOpen(!rightPanelOpen)}
          selectedFiles={selectedFiles}
          onRemoveFile={handleRemoveFile}
          onOpenChat={handleOpenChat}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
