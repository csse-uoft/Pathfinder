import React, {useContext, useRef, useEffect, useState} from 'react';
import cytoscape from 'cytoscape';
import ReactDOM from "react-dom/client";
import {Container} from "@mui/material";
import {makeStyles} from "@mui/styles";
const useStyles = makeStyles(() => ({
  root: {
    width: '80%'
  },
  button: {
    marginTop: 12,
    marginBottom: 0,
    length: 100
  },
}));

export default function NodeGraph() {


  const classes = useStyles();

  const cyRef = useRef(null);

  useEffect(() => {
    // Initialize Cytoscape
    cyRef.current = cytoscape({
      container: document.getElementById('cy'), // container to render in
      elements: [ // list of graph elements to start with
        { // node a
          data: { id: 'a' }
        },
        { // node b
          data: { id: 'b' }
        },
        { // edge ab
          data: { id: 'ab', source: 'a', target: 'b' }
        }
      ],
      style: [ // the stylesheet for the graph
        {
          selector: 'node',
          style: {
            'background-color': '#666',
            'label': 'data(id)'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle'
          }
        }
      ],
      layout: {
        name: 'grid',
        rows: 1
      }
    });

    // Cleanup on component unmount
    return () => {
      cyRef.current.destroy();
    };
  }, []);

  return (
    <Container sx={{alignItems: 'center', display: 'flex', width: '100vw', height: '100vh', padding: 0}}>
      <div style={{width: '30%', height: '80%', border: '2px solid black'}}/>
      <div id="cy" style={{marginLeft: "5%",width: '80%', height: '80%', border: '2px solid black'}}>

      </div>
    </Container>

  );
}