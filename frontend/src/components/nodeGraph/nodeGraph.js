import React, { useRef, useEffect, useState } from 'react';
import cytoscape from 'cytoscape';
import { Container, Button, TextField, Drawer, IconButton, Tabs, Tab, Box, Typography, Dialog, DialogActions, DialogContent, DialogTitle, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles(() => ({
  root: {
    width: '100vw',
    height: '100vh',
    margin: 0,
    padding: 0,
    display: 'flex',
  },
  cyContainer: {
    width: '100%',
    height: '100%',
  },
  drawer: {
    width: 400,
    padding: '10px',
  },
  closeButton: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  button: {
    marginTop: 12,
    marginBottom: 0,
    length: 100,
  },
  tabPanel: {
    padding: '10px',
  },
  formControl: {
    marginTop: 16,
    minWidth: 120,
  },
}));

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

export default function NodeGraph() {
  const classes = useStyles();
  const cyRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeColor, setNodeColor] = useState('#666');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedData, setSelectedData] = useState('basic');
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    cyRef.current = cytoscape({
      container: document.getElementById('cy'),
      elements: [
        { data: { id: 'a', label: 'Node A' } },
        { data: { id: 'b', label: 'Node B' } },
        { data: { id: 'c', label: 'Node C' } },
        { data: { id: 'd', label: 'Node D' } },
        { data: { id: 'ab', source: 'a', target: 'b' } },
        { data: { id: 'ca', source: 'c', target: 'a' } }
      ],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#666',
            'label': 'data(label)',
            'width': '150px',
            'height': '150px',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '14px',
            'text-wrap': 'wrap',
            'text-max-width': '100px',
            'transition-property': 'background-color, border-width, border-color',
            'transition-duration': '0.5s'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        }
      ],
      layout: {
        name: 'grid',
        rows: 1
      }
    });

    cyRef.current.on('tap', 'node', (evt) => {
      const node = evt.target;
      setSelectedNode(node.data());
      setNodeColor(node.style('background-color'));
      setDrawerOpen(true);
    });

    return () => {
      cyRef.current.destroy();
    };
  }, []);

  const handleColorChange = (event) => {
    setNodeColor(event.target.value);
  };

  const updateNodeColor = () => {
    if (selectedNode) {
      const node = cyRef.current.getElementById(selectedNode.id);
      node.style('background-color', nodeColor);
    }
  };

  const handleClose = () => {
    setDrawerOpen(false);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDialogOpen = () => {
    setNodes(cyRef.current.nodes().map(node => node.data()));
    setEdges(cyRef.current.edges().map(edge => edge.data()));
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleDataChange = (event) => {
    setSelectedData(event.target.value);
  };

  const renderSelectedData = () => {
    if (selectedData === 'all') {
      cyRef.current.nodes().style('display', 'element');
      cyRef.current.edges().style('display', 'element');
    } else {
      cyRef.current.nodes().style('display', 'none');
      cyRef.current.edges().style('display', 'none');
      cyRef.current.getElementById(selectedData).style('display', 'element');
      cyRef.current.edges(`[source = "${selectedData}"], [target = "${selectedData}"]`).style('display', 'element');
      cyRef.current.nodes(`[id = "${selectedData}"]`).neighborhood().nodes().style('display', 'element');
    }
  };

  const getRelationships = () => {
    if (!selectedNode) return null;
    const edges = cyRef.current.edges(`[source = "${selectedNode.id}"], [target = "${selectedNode.id}"]`);
    return edges.map(edge => (
      <p key={edge.id()}>Edge ID: {edge.id()} (Source: {edge.data('source')}, Target: {edge.data('target')})</p>
    ));
  };

  const getNeighborhood = () => {
    if (!selectedNode) return null;
    const neighborhood = cyRef.current.$(`#${selectedNode.id}`).neighborhood().nodes();
    return neighborhood.map(node => (
      <p key={node.id()}>Node ID: {node.id()}, Label: {node.data('label')}</p>
    ));
  };

  return (
    <div className={classes.root}>
      <div id="cy" className={classes.cyContainer}></div>
      <Button variant="contained" color="primary" onClick={handleDialogOpen}>
        Select Data to Render
      </Button>
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Select Data</DialogTitle>
        <DialogContent>
          <FormControl className={classes.formControl}>
            <InputLabel id="data-select-label">Node</InputLabel>
            <Select
              labelId="data-select-label"
              value={selectedData}
              onChange={handleDataChange}
            >
              <MenuItem value="all">All</MenuItem>
              {nodes.map(node => (
                <MenuItem key={node.id} value={node.id}>{node.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { renderSelectedData(); handleDialogClose(); }} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleClose}
        className={classes.drawer}
      >
        <div className={classes.drawer}>
          <div className={classes.closeButton}>
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </div>
          {selectedNode ? (
            <div>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="node information tabs">
                <Tab label="Basic Information" />
                <Tab label="Relationship" />
                <Tab label="Neighborhood" />
              </Tabs>
              <TabPanel value={tabValue} index={0}>
                <>
                  <p>ID: {selectedNode.id}</p>
                  <p>Label: {selectedNode.label}</p>
                  <TextField
                    label="Node Color"
                    type="color"
                    value={nodeColor}
                    onChange={handleColorChange}
                    fullWidth
                    margin="normal"
                  />
                  <Button variant="contained" color="primary" onClick={updateNodeColor} className={classes.button}>
                    Update Color
                  </Button>
                </>
                {selectedData === 'relationship' && getRelationships()}
                {selectedData === 'neighborhood' && getNeighborhood()}
              </TabPanel>
              <TabPanel value={tabValue} index={1}>
                {getRelationships()}
              </TabPanel>
              <TabPanel value={tabValue} index={2}>
                {getNeighborhood()}
              </TabPanel>
            </div>
          ) : (
            <p>Click on a node to see its information</p>
          )}
        </div>
      </Drawer>
    </div>
  );
}
