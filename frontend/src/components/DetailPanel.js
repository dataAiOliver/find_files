import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material';

function DetailPanel({ selectedFile }) {
  if (!selectedFile) {
    return (
      <Paper sx={{ height: 200, m: 1, p: 2 }}>
        <Typography variant="body1" color="text.secondary">
          Wählen Sie eine Datei aus, um Details anzuzeigen
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ height: 200, m: 1, overflow: 'auto' }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Dateidetails
        </Typography>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell component="th" scope="row">
                Dateipfad
              </TableCell>
              <TableCell>{selectedFile.filepath}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row">
                Angepasster Pfad
              </TableCell>
              <TableCell>
                {Array.isArray(selectedFile.filepath_custom) ? (
                  selectedFile.filepath_custom.map((path, index) => (
                    <div key={index}>{path}</div>
                  ))
                ) : (
                  selectedFile.filepath_custom
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}

export default DetailPanel;
