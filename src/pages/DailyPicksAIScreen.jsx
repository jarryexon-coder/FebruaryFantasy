// Web version of DailyPicksAIScreen
// Converted from React Native to Material-UI
import React from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Container,
} from '@mui/material'

// TODO: Convert React Native components to Material-UI
// Original screen: ../nba-frontend-clean/src/screens/DailyPicksAIScreen.js

const DailyPicksAIScreen = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h1" gutterBottom>
        DailyPicksAIScreen
      </Typography>
      <Typography variant="body1" color="text.secondary">
        This screen was converted from React Native. 
        Manual adjustments needed for full functionality.
      </Typography>
      <Box mt={4}>
        <Button
          variant="contained"
          href="/diagnostic"
        >
          Test Backend Connection
        </Button>
      </Box>
    </Container>
  )
}

export default DailyPicksAIScreen
