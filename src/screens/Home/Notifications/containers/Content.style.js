const { StyleSheet } = require("react-native");

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingTop: 20,
  },
  item: {
    width: "100%",
    marginBottom: 20,
    backgroundColor: "white",
    borderRadius: 5,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  // listContent: { paddingTop: 20 },
  emptyContainer: { flexGrow: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
  emptyText: { color: "#707070", fontFamily: "Poppins_400Regular", textAlign: "center" },
});
