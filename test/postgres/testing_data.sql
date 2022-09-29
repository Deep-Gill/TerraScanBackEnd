INSERT INTO public.users (email,github_username,"password","admin") VALUES
	 ('nicho@nicho.dev','nichogx','$2b$12$hrL8NTzxt9Ll56eHwEiuQ.fVMN.i3vf0g/18M/W6wieS.7CYCOsLG',true),
	 ('test@example.org','testuser','$2a$10$e7iVsOYav6pDcxkBNj8cK.prpamrnwCQZPISpx3uFb.I1KsAQNxQe',true),
	 ('mtest@gmail.com','test','$2a$10$l.HH40nVPMlybFkx10YzDOh1LjJ74gFye9Cu5A9Sonng6IyQ5BlPy',false),
	 ('mtest1@gmail.com','mtest1','$2a$10$3oNU4cppo.Xf3eB2B63VAujzj9lZJw9lgBdQ7wnSuw7QHvud3q5v6',false),
	 ('wangbolin9827@gmail.com','LinlinlinlinW','$2a$10$Ap.p.NAP2r7Z8SDH8Q3IluTRlS5KRwl8RsOJ80BII9uqmqB5JFPu.',false),
	 ('mtest11/6@gmail.com','mtest11/6','$2a$10$1gUD85g7LNHci2y26CM/nOhl3wsV3XJQsOruuxpW9NhzfkbLprQh.',false),
	 ('some.cpsc319.test@gmail.com','marquesarthur','$2a$10$FZeRTx7bbIkhisTiYxTju.SZCXnI8KNJ08Yl0B1/pPyydyEC/fFay',false),
	 ('marques.s.arthur@gmail.com','marquesarthur123','$2a$10$jc104gVIepkdu0xVvBwR8.a2u4JyyLtARNRXIVF5MtIa2c7qBIujO',false),
	 ('mtest2@gmail.com','mtest2','$2a$10$mZN1zkCcmmtnlhzfrFTzHebm4tGcJzWgzzaTPVsQ6njLelUQBm.V6',false);

INSERT INTO public.rules (description,yaml_file,created,last_modified,severity,category,enabled) VALUES
	 ('rule 1','{"test": 1,"test2": {"this is a": "test!","succeeded": true}}','2021-10-13 19:39:36.352','2021-10-13 19:39:36.352',0,'GENERAL',TRUE),
	 ('rule two','{"yaml":true}','2021-10-16 03:49:54.415','2021-10-16 03:49:54.415',0,'GENERAL',TRUE),
	 ('rule 3','{"yaml":true}','2021-10-16 03:50:42.481','2021-10-16 03:50:42.481',0,'GENERAL',TRUE),
	 ('rule 4','{"yaml":true}','2021-10-16 03:51:03.782','2021-10-16 03:51:03.782',0,'GENERAL',TRUE),
	 ('rule 5','{"yaml":true}','2021-10-16 03:51:46.059','2021-10-16 03:51:46.059',0,'GENERAL',TRUE),
	 ('rule 6','{"yaml":true}','2021-10-16 04:06:05.809','2021-10-16 04:06:05.809',0,'GENERAL',TRUE),
	 ('rule 7','{"yaml":false}','2021-10-16 04:07:16.263','2021-10-16 04:07:16.263',0,'GENERAL',TRUE),
	 ('rule 8','{"yaml":false}','2021-10-25 22:34:38.452','2021-10-25 22:34:38.452',0,'GENERAL',TRUE),
	 ('rule 9','{"yaml":false}','2021-10-25 22:40:55.045','2021-10-25 22:40:55.045',0,'GENERAL',FALSE);

INSERT INTO public.violations (repo_name,pull_url,file_path,line_number,resource_name,timestamp_found,timestamp_fixed,rule_id,github_username) VALUES
	 ('CPSC-319/TerraScanBackEnd','https://github.com/CPSC-319/TerraScanBackEnd/pull/1','terraform/example.tf',10,'example_resource','2021-10-14 12:26:16.215','2021-10-16 14:40:50.675',1,'testing'),
	 ('CPSC-319/TerraScanBackEnd','https://github.com/CPSC-319/TerraScanBackEnd/pull/2','terraform/example.tf',10,'example_resource','2021-10-14 12:26:16.215',NULL,1,'testing2'),
	 ('CPSC-319/TerraScanFrontEnd','https://github.com/CPSC-319/TerraScanFrontEnd/pull/1','terraform/example.tf',10,'example_resource','2021-10-16 14:40:50.675',NULL,2,'nichogx');
