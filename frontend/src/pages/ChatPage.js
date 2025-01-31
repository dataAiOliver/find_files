import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ThemeProvider } from '@mui/material/styles';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Typography,
  TextField,
  IconButton,
  Button,
  CssBaseline,
  FormGroup,
  FormControlLabel,
  Checkbox,
  ListItemButton,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Send as SendIcon,
  FilePresent as FileIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Article as DocIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  Delete as DeleteIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import theme from '../theme';

function ChatPage() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [chatHistory, setChatHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [selectedViews, setSelectedViews] = useState({
    files: true,
    chat: true,
  });
  const [fileContent, setFileContent] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const chatEndRef = useRef(null);
  const [selectedFileIds, setSelectedFileIds] = useState(new Set());
  const [mockPaths] = useState({
    'pdf': '/Users/oliverkohn/repositories/datasphereAI/find_files/backend/data/receipts.pdf',
    'docx': '/Users/oliverkohn/repositories/datasphereAI/find_files/backend/data/receipt1.docx',
    'xlsx': '/Users/oliverkohn/repositories/datasphereAI/find_files/backend/data/example.xlsx'
  });

  useEffect(() => {
    // Get selected files from localStorage
    const filesFromStorage = localStorage.getItem('selectedFiles');
    console.log('Files from storage:', filesFromStorage)
    if (filesFromStorage) {
      try {
        const files = JSON.parse(filesFromStorage);
        console.log('Files from storage:', files); // Debug log
        
        // Transform the files to include id, name, type, metadata, and src information
        const transformedFiles = Object.entries(files).map(([fileId, fileData]) => {
          if (!fileData) {
            console.warn(`File data is missing for ID: ${fileId}`);
            return null;
          }
          
          return {
            id: fileId,  // This is already the MongoDB _id from the file storage
            _id: fileId, // Also store as _id for consistency
            name: fileData.filepath?.split('/').pop() || 'Unknown File',
            type: 'file',
            metadata: fileData.metadata || {},
            fullPath: fileData.filepath || '',
            src: fileData.src || {}
          };
        }).filter(Boolean); // Remove any null entries
        
        console.log('Transformed files:', transformedFiles); // Debug log
        setSelectedFiles(transformedFiles);
        // Select all files by default
        setSelectedFileIds(new Set(transformedFiles.map(file => file.id)));
      } catch (error) {
        console.error('Error processing files from storage:', error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchFileContent = async () => {
      // Only fetch content if chat view is active
      if (!selectedViews.chat) return;
      
      const currentFile = selectedFiles[selectedFileIndex];
      if (!currentFile) return;

      setLoading(true);
      try {
        const fileExtension = currentFile.name.split('.').pop().toLowerCase();
        setFileType(fileExtension);

        // Set mock path for document files
        if (['pdf', 'docx', 'xlsx'].includes(fileExtension)) {
          setFileContent(mockPaths[fileExtension] || null);
        } 
        // Fetch content for text files
        else if (['txt', 'json', 'js', 'py'].includes(fileExtension)) {
          const response = await axios.get(`http://localhost:8000/api/content`, {
            params: { filepath: currentFile.fullPath }
          });
          setFileContent(response.data);
        }
        setError(null);
      } catch (error) {
        console.error('Error handling file:', error);
        setError('Error loading file ' + currentFile.name);
      } finally {
        setLoading(false);
      }
    };

    fetchFileContent();
  }, [selectedFiles, selectedFileIndex, selectedViews.chat, mockPaths]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const selectedFilesList = selectedFiles.filter(file => selectedFileIds.has(file.id));
    const newMessage = {
      role: 'user',
      content: message
    };

    // Add user message to chat history immediately
    setChatHistory(prev => [...prev, newMessage]);
    setMessage('');

    try {
      const response = await axios.post('http://localhost:8000/api/chat', {
        message: message,
        fileIds: selectedFilesList.map(file => file.id),
        chatHistory: [...chatHistory, newMessage] // Send updated chat history including the new message
      });

      // Create assistant message from string response
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: response.data
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Error: Could not process your message.'
      }]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleViewChange = (view) => {
    setSelectedViews(prev => {
      const newViews = { ...prev, [view]: !prev[view] };
      // Ensure at least one view is always selected
      if (!Object.values(newViews).some(Boolean)) {
        return prev;
      }
      return newViews;
    });
  };

  const getFileIcon = (filename) => {
    if (filename.endsWith('.pdf')) return <PdfIcon />;
    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) return <ExcelIcon />;
    if (filename.endsWith('.docx') || filename.endsWith('.doc')) return <DocIcon />;
    return <FileIcon />;
  };

  const handleDeleteFile = (fileId) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
    setSelectedFileIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(fileId);
      return newSet;
    });
  };

  const handleFileSelection = (fileId) => {
    setSelectedFileIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const handleSelectAllFiles = () => {
    if (selectedFileIds.size === selectedFiles.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(selectedFiles.map(file => file.id)));
    }
  };

  const handlePreviewFile = (file) => {
    const mockPaths = {
      'pdf': '/Users/oliverkohn/repositories/datasphereAI/find_files/backend/data/receipt2.pdf',
      'docx': '/Users/oliverkohn/repositories/datasphereAI/find_files/backend/data/receipt1.docx',
      'xlsx': '/Users/oliverkohn/repositories/datasphereAI/find_files/backend/data/example.xlsx'
    };

    const fileExtension = file.name.split('.').pop().toLowerCase();
    const mockPath = mockPaths[fileExtension];
    
    if (mockPath) {
      const timestamp = new Date().getTime();
      window.open(`http://localhost:8000/api/content?filepath=${encodeURIComponent(mockPath)}&t=${timestamp}`, '_blank');
    }
  };

  const renderFileList = () => {
    return (
      <Box sx={{ height: '100%', overflow: 'auto' }}>
        <List>
          <ListItem>
            <ListItemIcon>
              <Checkbox
                icon={<CheckBoxOutlineBlankIcon />}
                checkedIcon={<CheckBoxIcon />}
                checked={selectedFileIds.size === selectedFiles.length}
                onChange={handleSelectAllFiles}
              />
            </ListItemIcon>
            <ListItemText primary="Alle auswählen" />
          </ListItem>
          {selectedFiles.map((file, index) => (
            <ListItem
              key={file.id}
              secondaryAction={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Vorschau">
                    <IconButton
                      edge="end"
                      onClick={() => handlePreviewFile(file)}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <IconButton
                    edge="end"
                    onClick={() => handleDeleteFile(file.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemIcon>
                <Checkbox
                  icon={<CheckBoxOutlineBlankIcon />}
                  checkedIcon={<CheckBoxIcon />}
                  checked={selectedFileIds.has(file.id)}
                  onChange={() => handleFileSelection(file.id)}
                />
              </ListItemIcon>
              <ListItemText
                primary={file.name}
                secondary={file.fullPath}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  const renderChatMessages = () => {
    return (
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        {chatHistory.map((chat, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: chat.role === 'user' ? 'flex-end' : 'flex-start',
              gap: 1
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 2,
                maxWidth: '80%',
                bgcolor: chat.role === 'user' ? 'primary.light' : 'background.paper',
                color: chat.role === 'user' ? 'primary.contrastText' : 'text.primary'
              }}
            >
              <Typography variant="body1">
                {chat.content}
              </Typography>
            </Paper>
          </Box>
        ))}
        <div ref={chatEndRef} />
      </Box>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {selectedViews.files && (
          <Paper
            sx={{
              width: '400px',
              display: 'flex',
              flexDirection: 'column',
              borderRight: 1,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">Dateien</Typography>
            </Box>
            {renderFileList()}
          </Paper>
        )}

        {selectedViews.chat && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">Chat</Typography>
            </Box>
            {renderChatMessages()}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <form onSubmit={handleSendMessage}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Nachricht eingeben..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <IconButton type="submit" disabled={!message.trim()}>
                        <SendIcon />
                      </IconButton>
                    ),
                  }}
                />
              </form>
            </Box>
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default ChatPage;
