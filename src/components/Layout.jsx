import { useState } from "react";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Button,
  MenuItem,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Layout = ({ children }) => {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleNavigate = (path) => {
    navigate(path);
    handleCloseNavMenu();
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static">
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            {/* Desktop Logo */}
            <MusicNoteIcon
              sx={{ display: { xs: "none", md: "flex" }, mr: 1 }}
            />
            <Typography
              variant="h6"
              noWrap
              component="a"
              href="/"
              sx={{
                mr: 2,
                display: { xs: "none", md: "flex" },
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: ".3rem",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              MATCH MY TUNES
            </Typography>

            {/* Mobile Menu */}
            <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
              <IconButton
                size="large"
                onClick={handleOpenNavMenu}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorElNav}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "left",
                }}
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
                sx={{
                  display: { xs: "block", md: "none" },
                }}
              >
                <MenuItem onClick={() => handleNavigate("/")}>
                  <Typography textAlign="center">Home</Typography>
                </MenuItem>
                <MenuItem onClick={() => handleNavigate("/about")}>
                  <Typography textAlign="center">About</Typography>
                </MenuItem>
                {!user && (
                  <>
                    <MenuItem onClick={() => handleNavigate("/login")}>
                      <Typography textAlign="center">Login</Typography>
                    </MenuItem>
                    <MenuItem onClick={() => handleNavigate("/signup")}>
                      <Typography textAlign="center">Sign Up</Typography>
                    </MenuItem>
                  </>
                )}
                {user && (
                  <MenuItem onClick={logout}>
                    <Typography textAlign="center">Logout</Typography>
                  </MenuItem>
                )}
              </Menu>
            </Box>

            {/* Mobile Logo */}
            <MusicNoteIcon
              sx={{ display: { xs: "flex", md: "none" }, mr: 1 }}
            />
            <Typography
              variant="h5"
              noWrap
              component="a"
              href="/"
              sx={{
                mr: 2,
                display: { xs: "flex", md: "none" },
                flexGrow: 1,
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: ".3rem",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              MMT
            </Typography>

            {/* Desktop Menu */}
            <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
              <Button
                onClick={() => handleNavigate("/")}
                sx={{ my: 2, color: "white", display: "block" }}
              >
                Home
              </Button>
              <Button
                onClick={() => handleNavigate("/about")}
                sx={{ my: 2, color: "white", display: "block" }}
              >
                About
              </Button>
            </Box>

            {/* Desktop Auth Buttons */}
            <Box sx={{ display: { xs: "none", md: "flex" } }}>
              {!user ? (
                <>
                  <Button
                    onClick={() => handleNavigate("/login")}
                    sx={{ color: "white" }}
                  >
                    Login
                  </Button>
                  <Button
                    onClick={() => handleNavigate("/signup")}
                    variant="contained"
                    sx={{ ml: 2, bgcolor: theme.palette.primary.light }}
                  >
                    Sign Up
                  </Button>
                </>
              ) : (
                <>
                  <Typography sx={{ mr: 2, alignSelf: "center" }}>
                    Welcome, {user.displayName}
                  </Typography>
                  <Button onClick={logout} sx={{ color: "white" }}>
                    Logout
                  </Button>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
