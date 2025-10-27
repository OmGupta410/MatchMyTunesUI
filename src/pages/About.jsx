import { Box, Container, Typography } from "@mui/material";

const About = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
        pt: 8,
        pb: 6,
      }}
    >
      <Container maxWidth="md">
        <Typography
          component="h1"
          variant="h3"
          align="center"
          gutterBottom
          sx={{ fontWeight: "bold" }}
        >
          About Match My Tunes
        </Typography>
        <Typography variant="h6" align="justify" paragraph sx={{ mb: 4 }}>
          Match My Tunes is a unique platform that brings music lovers together.
          We believe that music is more than just entertainment - it's a way to
          connect, share experiences, and build meaningful relationships.
        </Typography>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
          Our Mission
        </Typography>
        <Typography variant="body1" paragraph>
          To create a vibrant community where people can connect through their
          shared love of music. Whether you're a casual listener or a dedicated
          audiophile, Match My Tunes helps you find people who share your unique
          musical taste.
        </Typography>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
          How It Works
        </Typography>
        <Typography variant="body1" paragraph>
          Simply connect your Spotify account, and our intelligent algorithm
          will analyze your music preferences. We look at your favorite artists,
          genres, and listening habits to match you with people who have similar
          tastes. It's that simple!
        </Typography>
      </Container>
    </Box>
  );
};

export default About;
