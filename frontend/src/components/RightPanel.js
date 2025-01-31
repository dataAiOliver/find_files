import React from 'react';
import {
  Box,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Button,
  Divider,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon,
  PlaylistRemove as DeselectAllIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';

function RightPanel({ open, onToggle, selectedFiles, onRemoveFile, onOpenChat }) {
  const handleDeselectAll = () => {
    // Pass all file IDs at once
    const allFileIds = selectedFiles.map(file => file.id);
    onRemoveFile(allFileIds);
  };

  return (
    <Box sx={{ 
      position: 'relative',
      width: open ? 300 : 40,
      transition: 'width 0.2s',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <IconButton
        onClick={onToggle}
        sx={{
          position: 'absolute',
          left: 0,
          top: 8,
          zIndex: 1,
          backgroundColor: 'background.paper',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
          boxShadow: 1,
        }}
      >
        {open ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </IconButton>
      
      {open && (
        <Paper sx={{ 
          height: '100%',
          ml: 2,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Ausgewählte Dateien
              </Typography>
              {selectedFiles.length > 0 && (
                <Button
                  startIcon={<DeselectAllIcon />}
                  onClick={handleDeselectAll}
                  size="small"
                  color="error"
                  variant="outlined"
                >
                  Alle entfernen
                </Button>
              )}
            </Box>
            <List sx={{ overflow: 'auto', flex: 1 }}>
              {selectedFiles.map((file) => (
                <ListItem 
                  key={file.id}
                  sx={{ 
                    bgcolor: 'background.paper',
                    mb: 1,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <ListItemText 
                    primary={file.name}
                    secondary={file.fullPath}
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={() => onRemoveFile(file.id)}
                    >
                      <CloseIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {selectedFiles.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                  Keine Dateien ausgewählt
                </Typography>
              )}
            </List>
          </Box>
          
          {selectedFiles.length > 0 && (
            <>
              <Divider />
              <Box sx={{ p: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<ChatIcon />}
                  onClick={onOpenChat}
                >
                  Chat mit Dateien öffnen
                </Button>
              </Box>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
}

export default RightPanel;
