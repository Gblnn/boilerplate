// import { useAuth } from "../context/AuthContext";
// import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
// import { LoaderCircle, LogOut, RefreshCcw, UserX } from "lucide-react";

// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuGroup,
//   DropdownMenuItem,
// } from "./ui/dropdown-menu";
// import { useNavigate } from "react-router-dom";

// interface Props {
//   trigger?: any;
//   onExport?: any;
//   onAccess?: any;
//   onArchives?: any;
//   onUpload?: any;
//   onInbox?: any;
//   className?: any;
//   onLogout?: any;
//   onProfile?: any;
//   isOnline?: boolean;
//   allocated_hours?: number;
//   name?: string;
// }

// export default function IndexDropDown(props: Props) {
//   const { displayName, email } = useAuth();
//   const usenavigate = useNavigate();

//   return (
//     <>
//       <DropdownMenu>
//         <DropdownMenuTrigger
//           className={props.className}
//           style={{
//             outline: "none",
//             backdropFilter: "none",
//             display: "flex",
//             border: "",
//             justifyContent: "center",
//             alignItems: "center",
//             borderRadius: "50%",
//           }}
//         >
//           {displayName ? (
//             <LazyLoader background="rgba(100 100 100/ 0%)" name={displayName} />
//           ) : !props.isOnline ? (
//             <UserX style={{ opacity: 0.5 }} />
//           ) : (
//             <LoaderCircle
//               className="animate-spin"
//               style={{ margin: "0.14rem" }}
//             />
//           )}
//         </DropdownMenuTrigger>

//         <DropdownMenuContent
//           style={{ margin: "0.25rem", marginRight: "1.25rem", width: "15rem" }}
//         >
//           <DropdownMenuGroup>
//             <DropdownMenuItem
//               onClick={() => {
//                 usenavigate("/profile");
//               }}
//               style={{
//                 width: "100%",
//                 display: "",
//                 border: "",
//                 justifyContent: "",
//                 flexFlow: "",
//                 paddingTop: "1rem",
//                 paddingBottom: "1rem",
//               }}
//             >
//               <div
//                 style={{
//                   border: "",
//                   width: "100%",
//                   display: "flex",
//                   alignItems: "center",
//                   gap: "0.75rem",
//                 }}
//               >
//                 <LazyLoader
//                   gradient
//                   fontSize="1.25rem"
//                   height="3rem"
//                   width="3rem"
//                   name={userEmail || ""}
//                 />
//                 <div style={{ border: "" }}>
//                   <p
//                     style={{
//                       border: "",
//                       fontSize: "1.05rem",
//                       fontWeight: "600",
//                     }}
//                   >
//                     {userName?.split(" ")[0]}
//                   </p>
//                   <p
//                     style={{
//                       fontSize: "0.65rem",
//                       opacity: "0.75",
//                       fontWeight: 800,
//                       color: "dodgerblue",
//                     }}
//                   >
//                     {userEmail}
//                   </p>
//                   {allocatedHours && (
//                     <p
//                       style={{
//                         fontSize: "0.7rem",
//                         background: "rgba(100 100 100/ 20%)",
//                         paddingLeft: "0.5rem",
//                         paddingRight: "0.5rem",
//                         borderRadius: "0.5rem",
//                       }}
//                     >
//                       <b>Allocated Hours</b> {allocatedHours}
//                     </p>
//                   )}
//                 </div>
//               </div>
//             </DropdownMenuItem>

//             <hr style={{ marginTop: "0.25rem", marginBottom: "0.25rem" }} />

//             <DropdownMenuItem
//               onClick={() => window.location.reload()}
//               style={{ width: "100%" }}
//             >
//               <RefreshCcw className="mr-2 " color="dodgerblue" />
//               <span style={{ width: "100%" }}>Force Reload</span>
//             </DropdownMenuItem>

//             {/* {props.onProfile && (
//               <DropdownMenuItem onClick={props.onProfile}>
//                 <User className="mr-2" color="dodgerblue" />
//                 <span style={{ width: "100%" }}>Profile</span>
//               </DropdownMenuItem>
//             )} */}

//             <DropdownMenuItem
//               onClick={props.onLogout}
//               style={{ width: "100%" }}
//             >
//               <LogOut className="mr-2 " color="salmon" />
//               <span style={{ width: "100%" }}>Logout</span>
//             </DropdownMenuItem>
//           </DropdownMenuGroup>
//         </DropdownMenuContent>
//       </DropdownMenu>
//     </>
//   );
// }
