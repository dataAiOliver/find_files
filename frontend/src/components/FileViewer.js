import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Grid,
  Paper,
  Typography,
  Breadcrumbs,
  Link,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  ListItemSecondaryAction,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Folder as FolderIcon,
  Description as FileIcon,
  ViewList as ListViewIcon,
  ViewModule as GridViewIcon,
  NavigateNext as NavigateNextIcon,
  ArrowBack as ArrowBackIcon,
  AccountTree as CustomPathIcon,
  FolderOpen as NormalPathIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  PlaylistAdd as SelectAllIcon,
  TableRows as TableViewIcon,
} from '@mui/icons-material';
import axios from 'axios';

function FileViewer({ filter, visualization, onFileSelect, selectedFiles, onFilesChange, files }) {
  const [viewType, setViewType] = useState('list');
  const [currentPath, setCurrentPath] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [useCustomPaths, setUseCustomPaths] = useState(false);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/files`, {
          filter: filter || {}
        });
        const newFiles = response.data;
        console.log("Received files:", newFiles[0]); // Debug log
        if (onFilesChange) {
          onFilesChange(newFiles);
        }
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [filter, onFilesChange]);

  // Track visualization changes
  useEffect(() => {
    setUseCustomPaths(visualization === 'custom');
  }, [visualization]);

  const buildFileTree = () => {
    if (!files) return {};
    
    const tree = {};
    
    Object.entries(files).forEach(([id, fileData]) => {
      // Handle multiple custom paths
      const customPaths = useCustomPaths ? 
        (Array.isArray(fileData.filepath_custom) ? fileData.filepath_custom : [fileData.filepath_custom]) : 
        [fileData.filepath];
      
      // Process each path separately
      customPaths.forEach(pathStr => {
        const path = pathStr.split('/');
        
        let current = tree;
        path.forEach((segment, index) => {
          if (index === path.length - 1) {
            if (!current.files) current.files = [];
            current.files.push({
              id,
              name: segment,
              type: 'file',
              metadata: fileData.metadata,
              fullPath: pathStr,
              src: fileData.src || {},
              zusammenfassung: fileData.zusammenfassung
            });
          } else {
            if (!current.dirs) current.dirs = {};
            if (!current.dirs[segment]) {
              current.dirs[segment] = {
                type: 'folder',
                name: segment
              };
            }
            current = current.dirs[segment];
          }
        });
      });
    });
    
    return tree;
  };

  const getCurrentFolder = () => {
    const tree = buildFileTree();
    let current = tree;
    
    for (const path of currentPath) {
      if (current.dirs && current.dirs[path]) {
        current = current.dirs[path];
      } else {
        return { dirs: {}, files: [] };
      }
    }
    
    const result = {};
    if (current.dirs) {
      Object.entries(current.dirs).forEach(([name, data]) => {
        result[name] = { type: 'folder', ...data };
      });
    }
    if (current.files) {
      current.files.forEach(file => {
        result[file.name] = { type: 'file', ...file };
      });
    }
    
    return result;
  };

  const getAllFilesInFolder = (folder) => {
    let files = [];
    
    // Get files in current folder
    if (folder.files) {
      files = [...folder.files];
    }
    
    // Recursively get files from subfolders
    if (folder.dirs) {
      Object.values(folder.dirs).forEach(dir => {
        files = [...files, ...getAllFilesInFolder(dir)];
      });
    }
    
    return files;
  };

  const handleItemClick = (itemName, isFolder) => {
    if (isFolder) {
      setCurrentPath([...currentPath, itemName]);
    } else {
      const currentFolder = getCurrentFolder();
      const file = currentFolder[itemName];
      console.log('Selected file:', file); // Debug log
      onFileSelect(file);
    }
    setSelectedItem(itemName);
  };

  const handleNavigateBack = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1));
      setSelectedItem(null);
    }
  };

  const handleBreadcrumbClick = (index) => {
    setCurrentPath(currentPath.slice(0, index + 1));
    setSelectedItem(null);
  };

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setViewType(newView);
    }
  };

  const handlePathTypeChange = (event, newPathType) => {
    if (newPathType !== null) {
      setUseCustomPaths(newPathType === 'custom');
      setCurrentPath([]); 
      setSelectedItem(null);
    }
  };

  const handleSelectAll = () => {
    const tree = buildFileTree();
    let current = tree;
    
    // Navigate to current folder in tree
    for (const path of currentPath) {
      if (current.dirs && current.dirs[path]) {
        current = current.dirs[path];
      } else {
        return;
      }
    }
    
    // Get all files in current folder and subfolders
    const allFiles = getAllFilesInFolder(current);
    
    // Pass all unselected files at once
    const unselectedFiles = allFiles.filter(file => !isFileSelected(file.id));
    if (unselectedFiles.length > 0) {
      onFileSelect(unselectedFiles);
    }
  };

  const isFileSelected = (fileId) => {
    return selectedFiles.some(file => file.id === fileId);
  };

  const getPathCounts = () => {
    if (!files) return { totalFiles: 0, currentPathFiles: 0 };
    
    const totalFiles = Object.keys(files).length;
    let currentPathFiles = 0;
    
    // Count files in current path
    const currentNode = getCurrentNode(buildFileTree());
    if (currentNode) {
      if (currentNode.files) {
        currentPathFiles += currentNode.files.length;
      }
      if (currentNode.dirs) {
        // Recursively count files in subdirectories
        const countFilesInDir = (dir) => {
          let count = 0;
          if (dir.files) count += dir.files.length;
          if (dir.dirs) {
            Object.values(dir.dirs).forEach(subdir => {
              count += countFilesInDir(subdir);
            });
          }
          return count;
        };
        Object.values(currentNode.dirs).forEach(dir => {
          currentPathFiles += countFilesInDir(dir);
        });
      }
    }
    
    return { totalFiles, currentPathFiles };
  };

  const getCurrentNode = (tree) => {
    if (!tree || currentPath.length === 0) return tree;
    
    let current = tree;
    for (const segment of currentPath) {
      if (current.dirs && current.dirs[segment]) {
        current = current.dirs[segment];
      } else {
        return null;
      }
    }
    return current;
  };

  const renderBreadcrumbs = () => (
    <Breadcrumbs 
      separator={<NavigateNextIcon fontSize="small" />}
      sx={{ mb: 0, ml: 2 }}
    >
      <Link
        component="button"
        variant="body1"
        onClick={() => {
          setCurrentPath([]);
          setSelectedItem(null);
        }}
        sx={{ 
          cursor: 'pointer',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline'
          }
        }}
      >
        Home
      </Link>
      {currentPath.map((path, index) => (
        <Link
          key={path}
          component="button"
          variant="body1"
          onClick={() => handleBreadcrumbClick(index)}
          sx={{ 
            cursor: 'pointer',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          {path}
        </Link>
      ))}
    </Breadcrumbs>
  );

  const renderListView = () => {
    const currentFolder = getCurrentFolder();
    
    return (
      <Box>
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            startIcon={<SelectAllIcon />}
            onClick={handleSelectAll}
            size="small"
            variant="outlined"
          >
            Alle Dateien auswählen
          </Button>
        </Box>
        <List>
          {Object.entries(currentFolder).map(([name, item]) => (
            <ListItem
              key={name}
              button
              onClick={() => item.type === 'folder' ? handleItemClick(name, true) : handleItemClick(name, false)}
              selected={selectedItem === name}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                bgcolor: item.type === 'file' && isFileSelected(item.id) ? 'action.selected' : 'background.paper',
              }}
            >
              <ListItemIcon>
                {item.type === 'folder' ? <FolderIcon /> : <FileIcon />}
              </ListItemIcon>
              <ListItemText primary={name} />
              {item.type === 'file' && (
                <ListItemSecondaryAction>
                  {isFileSelected(item.id) ? (
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileSelect(item);
                      }}
                      color="error"
                    >
                      <CloseIcon />
                    </IconButton>
                  ) : (
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileSelect(item);
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  )}
                </ListItemSecondaryAction>
              )}
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  const renderGridView = () => {
    const currentFolder = getCurrentFolder();
    
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            startIcon={<SelectAllIcon />}
            onClick={handleSelectAll}
            size="small"
            variant="outlined"
          >
            Alle Dateien auswählen
          </Button>
        </Box>
        <Grid container spacing={2}>
          {Object.entries(currentFolder).map(([name, item]) => (
            <Grid item xs={4} sm={3} md={2} key={name}>
              <Paper
                elevation={selectedItem === name ? 3 : 1}
                onClick={() => item.type === 'folder' ? handleItemClick(name, true) : handleItemClick(name, false)}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  bgcolor: item.type === 'file' && isFileSelected(item.id) ? 'action.selected' : 'background.paper',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                {item.type === 'folder' ? <FolderIcon sx={{ fontSize: 40 }} /> : <FileIcon sx={{ fontSize: 40 }} />}
                <Typography variant="body2" noWrap sx={{ mt: 1 }}>
                  {name}
                </Typography>
                {item.type === 'file' && (
                  <IconButton
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileSelect(item);
                    }}
                    color={isFileSelected(item.id) ? "error" : "default"}
                  >
                    {isFileSelected(item.id) ? <CloseIcon /> : <AddIcon />}
                  </IconButton>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  const renderTableView = () => {
    const tree = buildFileTree();
    const allFiles = [];
    
    // Recursive function to collect all files
    const collectFiles = (node, currentPath = '') => {
      if (node.files) {
        node.files.forEach(file => {
          allFiles.push({
            ...file,
            displayPath: currentPath ? `${currentPath}/${file.name}` : file.name
          });
        });
      }
      if (node.dirs) {
        Object.entries(node.dirs).forEach(([dirName, dirNode]) => {
          collectFiles(dirNode, currentPath ? `${currentPath}/${dirName}` : dirName);
        });
      }
    };
    
    collectFiles(tree);
    
    return (
      <Box sx={{ p: 2 }}>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} size="medium">
            <TableHead>
              <TableRow>
                <TableCell>Datei</TableCell>
                <TableCell>Zusammenfassung</TableCell>
                <TableCell align="right">Aktion</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allFiles.map((file) => (
                <TableRow
                  key={file.id}
                  hover
                  sx={{ 
                    cursor: 'pointer',
                    bgcolor: isFileSelected(file.id) ? 'action.selected' : 'inherit'
                  }}
                >
                  <TableCell component="th" scope="row">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FileIcon sx={{ mr: 1 }} />
                      {file.displayPath}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'pre-wrap' }}>
                    {file.zusammenfassung || 'Keine Zusammenfassung verfügbar'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileSelect(file);
                      }}
                      color={isFileSelected(file.id) ? "error" : "default"}
                    >
                      {isFileSelected(file.id) ? <CloseIcon /> : <AddIcon />}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="body2" color="text.secondary">
          {(() => {
            const { totalFiles, currentPathFiles } = getPathCounts();
            return `Total Files: ${totalFiles} | Current Path: ${currentPathFiles} files`;
          })()}
        </Typography>
        
        <ToggleButtonGroup
          value={viewType}
          exclusive
          onChange={handleViewChange}
          size="small"
        >
          <ToggleButton value="list">
            <Tooltip title="List View">
              <ListViewIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="grid">
            <Tooltip title="Grid View">
              <GridViewIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="table">
            <Tooltip title="Table View">
              <TableViewIcon />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: 1,
        borderColor: 'divider',
        p: 1,
        bgcolor: 'background.paper'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: 0 }}>
          {currentPath.length > 0 && (
            <IconButton 
              onClick={handleNavigateBack} 
              size="small" 
              sx={{ mr: 1 }}
              color="primary"
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          {renderBreadcrumbs()}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <ToggleButtonGroup
            value={useCustomPaths ? 'custom' : 'normal'}
            exclusive
            onChange={handlePathTypeChange}
            size="small"
          >
            <ToggleButton 
              value="normal" 
              aria-label="normal paths"
              sx={{ 
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  '&:hover': {
                    bgcolor: 'primary.light',
                  },
                },
              }}
            >
              <Tooltip title="Standard-Pfadstruktur">
                <NormalPathIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton 
              value="custom" 
              aria-label="custom paths"
              sx={{ 
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  '&:hover': {
                    bgcolor: 'primary.light',
                  },
                },
              }}
            >
              <Tooltip title="Benutzerdefinierte Pfadstruktur">
                <CustomPathIcon />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        bgcolor: 'background.default',
        position: 'relative'
      }}>
        {loading ? (
          <Box sx={{ 
            p: 2,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}>
            <Typography>Lädt...</Typography>
          </Box>
        ) : (
          viewType === 'list' ? renderListView() : 
          viewType === 'grid' ? renderGridView() :
          renderTableView()
        )}
      </Box>
    </Box>
  );
}

export default FileViewer;
