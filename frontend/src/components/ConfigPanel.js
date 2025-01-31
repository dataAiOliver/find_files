import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Button,
  TextField,
  Typography,
  IconButton,
  Autocomplete
} from '@mui/material';
import {
  Clear as ClearIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  DragIndicator
} from '@mui/icons-material';
import axios from 'axios';

// Helper function to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

function ConfigPanel({ onFilterChange, onVisualizationChange, files }) {
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState([
    { id: generateId(), key: '', value: '', type: 'str' }
  ]);
  const [suggestions, setSuggestions] = useState([]);
  const [pathElements, setPathElements] = useState([]);
  const [visualizationKeys, setVisualizationKeys] = useState([{ id: generateId(), key: '' }]);
  const [availableKeys, setAvailableKeys] = useState([]);

  // Fetch available keys from path2type when component mounts
  useEffect(() => {
    const fetchKeys = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/categories`);
        setAvailableKeys(response.data);
      } catch (error) {
        console.error('Error fetching keys:', error);
      }
    };
    fetchKeys();
  }, []);

  const fetchSuggestions = async (inputValue) => {
    if (!inputValue) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/filter-suggestions?prefix=${inputValue}`);
      setSuggestions(response.data);
    } catch (error) {
      console.error('Error getting filter suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleFilterKeyChange = (id, newValue, reason) => {
    console.log('Changing key for filter:', id, 'to:', newValue, 'reason:', reason);
    setFilters(prevFilters => {
      const newFilters = prevFilters.map(filter => {
        if (filter.id === id) {
          // Always update the key, whether it was typed or selected
          const matchingSuggestion = suggestions.find(s => s.key === newValue);
          return {
            ...filter,
            key: newValue || '',  // Ensure empty string if null/undefined
            type: matchingSuggestion ? matchingSuggestion.type : 'str'
          };
        }
        return filter;
      });
      console.log('New filters after key change:', newFilters);
      return newFilters;
    });
  };

  const handleFilterValueChange = (id, value) => {
    console.log('Changing value for filter:', id, 'to:', value);
    setFilters(prevFilters => {
      const newFilters = prevFilters.map(filter => {
        if (filter.id === id) {
          return { ...filter, value: value || '' };  // Ensure empty string if null/undefined
        }
        return filter;
      });
      console.log('New filters after value change:', newFilters);
      return newFilters;
    });
  };

  const handleAddFilter = () => {
    const newFilter = { id: generateId(), key: '', value: '', type: 'str' };
    setFilters(prevFilters => [...prevFilters, newFilter]);
  };

  const handleRemoveFilter = (idToRemove) => {
    setFilters(prevFilters => {
      const newFilters = prevFilters.filter(filter => filter.id !== idToRemove);
      if (newFilters.length === 0) {
        return [{ id: generateId(), key: '', value: '', type: 'str' }];
      }
      return newFilters;
    });
  };

  const handleApplyFilter = () => {
    console.log('Current filters before apply:', filters);
    const filterDict = {};
    // Include all keys and values, even if empty
    filters.forEach(({ key, value }) => {
      filterDict[key || ''] = value || '';
    });
    console.log('Final filter dictionary:', filterDict);
    onFilterChange(filterDict);
  };

  const handleClearFilters = () => {
    setFilters([{ id: generateId(), key: '', value: '', type: 'str' }]);
    onFilterChange({});
  };

  const handleVisualizationKeyChange = (id, newKey) => {
    setVisualizationKeys(prevKeys => {
      const newKeys = prevKeys.map(item => 
        item.id === id ? { ...item, key: newKey } : item
      );
      
      // Add new dropdown if this isn't the last one and it has a value
      const currentKeyIndex = newKeys.findIndex(item => item.id === id);
      const isLastKey = currentKeyIndex === newKeys.length - 1;
      
      if (newKey && isLastKey) {
        newKeys.push({ id: generateId(), key: '' });
      }
      
      // Update visualization
      const keyList = newKeys
        .map(item => item.key)
        .filter(key => key); // Remove empty keys
      
      onVisualizationChange(keyList);
      
      return newKeys;
    });
  };

  const handleRemoveVisualizationKey = (idToRemove) => {
    setVisualizationKeys(prevKeys => {
      const newKeys = prevKeys.filter(item => item.id !== idToRemove);
      if (newKeys.length === 0) {
        newKeys.push({ id: generateId(), key: '' });
      }
      
      // Update visualization
      const keyList = newKeys
        .map(item => item.key)
        .filter(key => key);
      
      onVisualizationChange(keyList);
      
      return newKeys;
    });
  };

  const handleReorderVisualizationKeys = (dragIndex, hoverIndex) => {
    setVisualizationKeys(prevKeys => {
      const newKeys = [...prevKeys];
      const draggedKey = newKeys[dragIndex];
      newKeys.splice(dragIndex, 1);
      newKeys.splice(hoverIndex, 0, draggedKey);
      
      // Update visualization
      const keyList = newKeys
        .map(item => item.key)
        .filter(key => key);
      
      onVisualizationChange(keyList);
      
      return newKeys;
    });
  };

  const handleRecalculate = async () => {
    try {
      // Get the current visualization keys (excluding empty ones)
      const activeKeys = visualizationKeys
        .map(item => item.key)
        .filter(key => key);

      if (activeKeys.length === 0) {
        return;
      }

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/recalculate`, {
        files: files,
        keys: activeKeys
      });

      if (onVisualizationChange) {
        onVisualizationChange('recalculated', response.data);
      }
    } catch (error) {
      console.error('Error recalculating:', error);
    }
  };

  const renderFilterPairs = () => (
    <Box sx={{ mt: 2 }}>
      {filters.map(filter => (
        <Box 
          key={filter.id}
          sx={{ 
            mb: 3,
            display: 'flex',
            gap: 1,
            alignItems: 'flex-start'
          }}
        >
          <Box
            sx={{
              flex: 1,
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1
            }}
          >
            <Autocomplete
              freeSolo
              options={suggestions.map(s => s.key)}
              value={filter.key}
              onChange={(_, newValue, reason) => handleFilterKeyChange(filter.id, newValue, reason)}
              onInputChange={(_, newValue) => {
                handleFilterKeyChange(filter.id, newValue, 'input');
                fetchSuggestions(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filter Key"
                  size="small"
                  fullWidth
                  sx={{ mb: 2 }}
                />
              )}
            />
            
            <TextField
              value={filter.value}
              onChange={(e) => handleFilterValueChange(filter.id, e.target.value)}
              label={`Value (${filter.type})`}
              size="small"
              fullWidth
            />
          </Box>

          <IconButton 
            onClick={() => handleRemoveFilter(filter.id)}
            color="error"
            size="small"
            sx={{ mt: 1 }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}
      
      <Button
        startIcon={<AddIcon />}
        onClick={handleAddFilter}
        variant="outlined"
        size="small"
        fullWidth
        sx={{ mt: 1 }}
      >
        Add Filter
      </Button>
    </Box>
  );

  const renderVisualizationOptions = () => (
    <Box sx={{ mt: 2 }}>
      {visualizationKeys.map((item, index) => (
        <Box
          key={item.id}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2,
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.paper',
            cursor: 'move'
          }}
          draggable
          onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(e) => {
            e.preventDefault();
            const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
            if (dragIndex !== index) {
              handleReorderVisualizationKeys(dragIndex, index);
            }
          }}
        >
          <DragIndicator sx={{ color: 'text.secondary' }} />
          <Autocomplete
            disablePortal
            sx={{ flex: 1 }}
            options={availableKeys}
            value={item.key}
            onChange={(_, newValue) => handleVisualizationKeyChange(item.id, newValue)}
            getOptionLabel={(option) => option || ''}
            isOptionEqualToValue={(option, value) => option === value}
            filterOptions={(options, { inputValue }) => {
              const searchValue = inputValue.toLowerCase();
              return options
                .filter(option => option.toLowerCase().includes(searchValue))
                .slice(0, 10); // Show only top 10 matches
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Key"
                placeholder="Choose or type to search..."
                size="small"
                fullWidth
              />
            )}
          />
          {index !== visualizationKeys.length - 1 && (
            <IconButton
              onClick={() => handleRemoveVisualizationKey(item.id)}
              size="small"
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      ))}
      
      <Button
        variant="contained"
        fullWidth
        onClick={handleRecalculate}
        sx={{ mt: 2 }}
      >
        Recalculate
      </Button>
    </Box>
  );

  return (
    <Paper 
      sx={{ 
        height: '100%', 
        overflow: 'auto',
        bgcolor: 'background.paper',
        boxShadow: 2,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        centered
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Tab label="Filter" />
        {/* <Tab label="Visualization" /> */}
      </Tabs>

      <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
        {activeTab === 0 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="outlined"
                color="error"
                onClick={handleClearFilters}
                startIcon={<ClearIcon />}
              >
                Clear Filters
              </Button>
            </Box>

            {renderFilterPairs()}

            <Button
              variant="contained"
              fullWidth
              onClick={handleApplyFilter}
              sx={{ mt: 2 }}
            >
              Apply Filters
            </Button>
          </>
        )}

        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Select keys to visualize:
            </Typography>
            {renderVisualizationOptions()}
          </Box>
        )}
      </Box>
    </Paper>
  );
}

export default ConfigPanel;
