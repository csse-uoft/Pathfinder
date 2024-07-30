import React, { useRef, useEffect, useState } from 'react';
import cytoscape from 'cytoscape';
import { Container, Button, TextField, Drawer, IconButton, Tabs, Tab, Box, Typography } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { makeStyles } from "@mui/styles";

// Define custom styles using Material-UI's makeStyles
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
}));

// TabPanel component to manage content within each tab
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

  useEffect(() => {



    // Fetch data from the backend API
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data'); // Replace with your API endpoint
        const data = await response.json();
        initializeCytoscape(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();




    // Function to initialize Cytoscape with fetched data
    const initializeCytoscape = (data) => {
      cyRef.current = cytoscape({
        container: document.getElementById('cy'), // Container to render in
        elements: data, // Use fetched data
        style: [ // The stylesheet for the graph
          {
            selector: 'node',
            style: {
              'background-color': '#666',
              'label': 'data(label)',
              'width': '150px', // Adjust node width
              'height': '150px', // Adjust node height
              'text-valign': 'center',
              'text-halign': 'center',
              'font-size': '14px',
              'text-wrap': 'wrap',
              'text-max-width': '100px', // Adjust max text width
              'transition-property': 'background-color, border-width, border-color',
              'transition-duration': '0.5s'
            }
          },
          {
            selector: 'node.hover',
            style: {
              'background-color': '#FF5722',
              'border-width': 6,
              'border-color': '#FF9800'
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

      // Event listener for node clicks
      cyRef.current.on('tap', 'node', (evt) => {
        const node = evt.target;
        setSelectedNode(node.data());
        setNodeColor(node.style('background-color')); // Set the initial color to the node's current color
        setDrawerOpen(true); // Open the drawer
      });

      // Event listeners for mouseover and mouseout
      cyRef.current.on('mouseover', 'node', (evt) => {
        evt.target.addClass('hover');
      });

      cyRef.current.on('mouseout', 'node', (evt) => {
        evt.target.removeClass('hover');
      });
    };

    // Cleanup on component unmount
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, []);

  // Handle color change
  const handleColorChange = (event) => {
    setNodeColor(event.target.value);
  };

  // Update node color
  const updateNodeColor = () => {
    if (selectedNode) {
      const node = cyRef.current.getElementById(selectedNode.id);
      node.style('background-color', nodeColor);
    }
  };

  // Handle drawer close
  const handleClose = () => {
    setDrawerOpen(false);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Get relationships of the selected node
  const getRelationships = () => {
    if (!selectedNode) return null;
    const edges = cyRef.current.edges(`[source = "${selectedNode.id}"], [target = "${selectedNode.id}"]`);
    return edges.map(edge => (
      <p key={edge.id()}>Edge ID: {edge.id()} (Source: {edge.data('source')}, Target: {edge.data('target')})</p>
    ));
  };

  // Get neighborhood of the selected node
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
