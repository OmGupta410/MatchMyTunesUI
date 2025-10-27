import { Box, Container, Typography, Button } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

const Home = () => {
  const { user } = useAuth();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        color: "text.primary",
        pt: 8,
        pb: 6,
      }}
    >
      <Container maxWidth="sm">
        <Typography
          component="h1"
          variant="h2"
          align="center"
          gutterBottom
          sx={{ fontWeight: "bold" }}
        >
          Match My Tunes
        </Typography>
        <Typography
          variant="h5"
          align="center"
          color="text.secondary"
          paragraph
        >
          Connect with people who share your musical taste. Discover new music
          and make meaningful connections through the power of music.
        </Typography>
        <Box sx={{ mt: 4, display: "flex", justifyContent: "center", gap: 2 }}>
          {!user && (
            <Button variant="contained" color="primary" href="/login">
              Get Started
            </Button>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default Home;
